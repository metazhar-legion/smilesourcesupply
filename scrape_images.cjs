const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const fuzz = require('fuzzball');

const baseUrl = 'https://wisdomdentalsupply.com/products.json';
const limit = 250;
const outputDir = path.join(__dirname, 'public', 'images', 'products');
const inventoryFile = path.join(__dirname, 'smilesourceinventory.csv');

// Load inventory
if (!fs.existsSync(inventoryFile)) {
  console.error(`Inventory file not found: ${inventoryFile}`);
  process.exit(1);
}

const inventoryRows = fs.readFileSync(inventoryFile, 'utf-8')
  .split('\n')
  .map(line => line.split(',')[0].trim()) // First column is Item
  .filter(item => item && item.toLowerCase() !== 'item');

const inventoryItems = inventoryRows.map(item => ({
  original: item,
  safeName: item.replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_').replace(/_$/, '')
}));

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Download stream
async function downloadImage(url, dest) {
  const response = await fetch(url, { headers: { 'Accept': '*/*' } });
  if (!response.ok) throw new Error(`Status ${response.status}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(response.body).pipe(fileStream));
}

// Main logic
async function scrapeExactly() {
  console.log(`Phase 1: Fetching all products from ${baseUrl}...`);
  let page = 1;
  let hasMore = true;
  let allProducts = [];

  while (hasMore) {
    try {
      const url = `${baseUrl}?limit=${limit}&page=${page}`;
      process.stdout.write(`Fetching page ${page}... `);

      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`Status ${response.status}`);

      const data = await response.json();
      const products = data.products || [];
      console.log(`Got ${products.length} products.`);

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      for (const p of products) {
        allProducts.push({
          id: p.id,
          title: p.title,
          body_html: p.body_html || '',
          image: (p.images && p.images.length > 0) ? p.images[0].src.split('?')[0] : null
        });
      }
      page++;
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      console.error(`\nError fetching page ${page}:`, err.message);
      break;
    }
  }

  console.log(`\nPhase 2: Deep Context Scoring for ${inventoryItems.length} inventory items...`);
  let totalSaved = 0;

  for (const inv of inventoryItems) {
    let bestMatch = null;
    let highestScore = 0;

    for (const prod of allProducts) {
      if (!prod.image) continue;

      let score = fuzz.token_set_ratio(inv.original, prod.title);
      const titleBodyScore = fuzz.token_set_ratio(inv.original, prod.title + ' ' + prod.body_html.replace(/<[^>]+>/g, ' '));
      score = Math.max(score, titleBodyScore * 0.8);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = prod;
      }
    }

    if (bestMatch && highestScore >= 60) {
      if (bestMatch.image) {
        const ext = path.extname(bestMatch.image) || '.jpg';
        const filename = `${inv.safeName}${ext}`;
        const destPath = path.join(outputDir, filename);

        console.log(`[MATCH] ${inv.original} ---> ${bestMatch.title} (Score: ${Math.round(highestScore * 100)}%)`);

        try {
          if (!fs.existsSync(destPath)) {
            await downloadImage(bestMatch.image, destPath);
            totalSaved++;
          }
        } catch (err) {
          console.error(`  [-] Error downloading ${bestMatch.image}: ${err.message}`);
        }
      }
    } else {
      console.log(`[NO_MATCH] Could not find any intersection in descriptions for "${inv.original}"`);
    }
  }

  console.log(`\nDone! Successfully saved ${totalSaved} specific product images.`);
}

scrapeExactly();

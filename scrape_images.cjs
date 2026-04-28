const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

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

// Extract tokens for matching (strip HTML and punctuation)
function getTokens(str) {
  if (!str) return new Set();
  str = str.replace(/<[^>]+>/g, ' '); // remove html tags
  return new Set(str.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 0));
}

function calculateScore(invTokens, prodTokens) {
  let intersection = 0;
  for (const token of invTokens) {
    if (prodTokens.has(token)) intersection++;
  }
  if (invTokens.size === 0 || prodTokens.size === 0) return 0;
  const union = new Set([...invTokens, ...prodTokens]).size;
  return intersection / union; // Jaccard similarity
}

const inventoryItems = inventoryRows.map(item => ({
  original: item,
  safeName: item.replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_').replace(/_$/, ''),
  tokens: getTokens(item)
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
          titleTokens: getTokens(p.title),
          bodyTokens: getTokens(p.body_html || ''),
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

      let score = 0;
      const cleanInv = Array.from(inv.tokens).join(' ');
      const cleanTitle = Array.from(prod.titleTokens).join(' ');

      if (cleanInv === cleanTitle) {
        score = 10.0; // Exact match
      } else if (cleanTitle.includes(cleanInv) || cleanInv.includes(cleanTitle)) {
        score = 5.0;  // Substring match
      } else {
        const titleScore = calculateScore(inv.tokens, prod.titleTokens);
        const bodyScore = calculateScore(inv.tokens, prod.bodyTokens);
        score = titleScore + (bodyScore * 0.1); 
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = prod;
      }
    }

    // NO ARBITRARY FALLBACK: We map exactly or use generic database placeholder later
    if (bestMatch && highestScore >= 0.35) {
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

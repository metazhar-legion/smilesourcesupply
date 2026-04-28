const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const inventoryFile = path.join(__dirname, 'smilesourceinventory.csv');
const outputDir = path.join(__dirname, 'public', 'images', 'products');

async function downloadFallback() {
    const inventoryRows = fs.readFileSync(inventoryFile, 'utf-8').split('\n').map(line => line.split(',')[0].trim()).filter(Boolean);
    const existingFiles = fs.readdirSync(outputDir);

    const missingItems = [];
    for (const item of inventoryRows) {
        if (item.toLowerCase() === 'item') continue;
        const safeName = item.replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_').replace(/_$/, '');
        const exists = existingFiles.some(f => f.startsWith(safeName) && f !== 'generic_dental_placeholder.png');
        if (!exists) {
            missingItems.push({ original: item, safeName });
        }
    }

    console.log(`Found ${missingItems.length} missing items. Starting Puppeteer...`);
    
    if (missingItems.length === 0) return;

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    for (const item of missingItems) {
        let saved = false;
        try {
            console.log(`Searching for: ${item.original}`);
            await page.goto(`https://images.search.yahoo.com/search/images?p=${encodeURIComponent(item.original + ' dental product')}`, { waitUntil: 'domcontentloaded' });
            
            // Wait for images
            await page.waitForSelector('#resitem-0 img', { timeout: 3000 }).catch(() => {});
            
            const firstImg = await page.evaluate(() => {
                const img = document.querySelector('#resitem-0 img') || document.querySelector('img.process');
                if (!img) return null;
                return img.src || img.getAttribute('data-src');
            });

            if (firstImg) {
                const destPath = path.join(outputDir, `${item.safeName}.jpg`);
                if (firstImg.startsWith('data:image')) {
                    const base64Data = firstImg.split(',')[1];
                    fs.writeFileSync(destPath, base64Data, 'base64');
                    saved = true;
                } else if (firstImg.startsWith('http')) {
                    const r = await fetch(firstImg);
                    const buff = await r.arrayBuffer();
                    fs.writeFileSync(destPath, Buffer.from(buff));
                    saved = true;
                }
            }
        } catch (err) {
            console.error(` Error fetching ${item.original}:`, err.message);
        }
        
        if (saved) {
            console.log(` [+] Saved fallback for ${item.original}`);
        } else {
            console.log(` [-] Could not find any image for ${item.original}`);
        }
    }
    
    await browser.close();
    console.log("Fallback search complete.");
}

downloadFallback();

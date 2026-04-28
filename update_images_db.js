import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const files = fs.readdirSync('./public/images/products');

    // Fetch directly from DB
    const { data: dbProducts, error: fetchErr } = await supabaseAdmin.from('products').select('id, name');
    if (fetchErr) throw fetchErr;

    let updateCount = 0;

    for (const prod of dbProducts) {
        const cleanName = prod.name.trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_').replace(/_$/, '');
        let matchingFile = files.find(f => f.startsWith(cleanName));

        // Exact 1-to-1 matching. If we can't find it, we use the specific generic placeholder we generated.
        if (!matchingFile) {
            matchingFile = 'generic_dental_placeholder.png';
        }

        if (matchingFile) {
            const imageUrl = `/images/products/${matchingFile}`;
            const { error } = await supabaseAdmin
                .from('products')
                .update({ image_url: imageUrl })
                .eq('id', prod.id); // Securely bind via explicit ID mapping

            if (error) {
                console.error(`Error updating ${prod.name}:`, error.message);
            } else {
                updateCount++;
            }
        }
    }

    console.log(`\nSuccess! Re-mapped ${updateCount} product images gracefully with generic fallbacks.`);
}

run().catch(e => {
    console.error("Error setting image URLs:", e);
    process.exit(1);
});

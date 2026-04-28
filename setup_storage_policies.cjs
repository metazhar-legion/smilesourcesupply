const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DIRECT_CONNECT_STRING,
  });
  
  await client.connect();

  try {
    const res = await client.query(`
      CREATE POLICY "Allow authenticated uploads" 
      ON storage.objects FOR INSERT 
      TO authenticated 
      WITH CHECK (bucket_id = 'product-images');
      
      CREATE POLICY "Allow authenticated updates" 
      ON storage.objects FOR UPDATE 
      TO authenticated 
      USING (bucket_id = 'product-images');

      CREATE POLICY "Allow authenticated deletes" 
      ON storage.objects FOR DELETE 
      TO authenticated 
      USING (bucket_id = 'product-images');

      CREATE POLICY "Allow public read" 
      ON storage.objects FOR SELECT 
      TO public 
      USING (bucket_id = 'product-images');
    `);
    console.log("Policies created successfully.");
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Policies already exist or handled.');
    } else {
      console.error("Error creating policies:", err);
    }
  } finally {
    await client.end();
  }
}

main();

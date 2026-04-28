import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_PROJECT_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.storage.createBucket('product-images', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    fileSizeLimit: 1024 * 1024 * 10 // 10 MB
  });
  
  if (error) {
    console.error("Error creating bucket:", error);
  } else {
    console.log("Bucket created:", data);
  }
}

main();

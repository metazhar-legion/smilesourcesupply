import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS, POST',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const authHeader = event.headers.authorization;
        if (!authHeader) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
             return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
        }

        const body = JSON.parse(event.body);
        const { imageBase64, fileName, mimeType } = body;

        if (!imageBase64 || !fileName || !mimeType) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        const buffer = Buffer.from(imageBase64, 'base64');

        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ url: publicUrlData.publicUrl }) 
        };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};

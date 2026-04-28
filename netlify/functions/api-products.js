import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
// We use the Service Role Key here because Netlify Functions operates as our secure backend wrapper
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    // Preflight check for CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Public Read Access
        if (event.httpMethod === 'GET') {
            const { data, error } = await supabase.from('products').select('*').order('name');
            if (error) throw error;
            return { statusCode: 200, headers, body: JSON.stringify(data) };
        }

        // Authenticated Write Operations
        const authHeader = event.headers.authorization;
        if (!authHeader) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }) };
        }

        // Verify the Supabase JWT
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
             return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: Invalid JWT token' }) };
        }

        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { data, error } = await supabase.from('products').insert([body]).select();
            if (error) throw error;
            return { statusCode: 201, headers, body: JSON.stringify({ message: "Product created", data: data[0] }) };
        }

        if (event.httpMethod === 'PUT') {
            const body = JSON.parse(event.body);
            const { id, ...updates } = body;
            const { data, error } = await supabase.from('products').update(updates).eq('id', id).select();
            if (error) throw error;
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Product updated", data: data[0] }) };
        }

        if (event.httpMethod === 'DELETE') {
            const id = event.queryStringParameters.id;
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Product deleted" }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};

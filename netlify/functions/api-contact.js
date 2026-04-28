import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { first_name, last_name, email, practice_name, phone, message } = body;
        
        if (!first_name || !last_name || !email || !practice_name) {
             return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        const { error } = await supabase.from('inquiries').insert([{
            first_name,
            last_name,
            email,
            practice_name,
            phone,
            message
        }]);

        if (error) throw error;
        
        return { statusCode: 201, headers, body: JSON.stringify({ message: "Inquiry successfully submitted" }) };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};

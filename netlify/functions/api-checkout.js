import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Safely initialize Resend only if the key exists so it doesn't crash the server!
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

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
        const payload = JSON.parse(event.body);
        const { customer_name, customer_email, practice_name, total_amount, cart_items } = payload;

        if (!customer_name || !customer_email || !cart_items || !cart_items.length) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required checkout information.' }) };
        }

        // 1. Log the main order into Supabase
        const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
             customer_name,
             customer_email,
             practice_name,
             total_amount
        }]).select();

        if (orderError) throw orderError;
        const orderId = orderData[0].id;

        // 2. Log exactly what was ordered into order_items
        const itemsToInsert = cart_items.map(item => ({
             order_id: orderId,
             product_id: item.product_id, // can be null if custom item, but ideally linked
             product_name: item.product_name,
             quantity: item.quantity,
             unit_price: item.unit_price
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        // 3. Email the Sales Team via Resend
        let itemsHtml = `<ul>`;
        for (const item of cart_items) {
             itemsHtml += `<li>${item.quantity}x ${item.product_name} - $${item.unit_price}</li>`;
        }
        itemsHtml += `</ul>`;

        const htmlBody = `
            <h2>New Wholesale Order from ${practice_name || customer_name}</h2>
            <p><strong>Contact:</strong> ${customer_name} (${customer_email})</p>
            <h3>Requested Items:</h3>
            ${itemsHtml}
            <h3>Estimated Order Total: $${total_amount}</h3>
            <hr />
            <p>Order Reference ID: ${orderId}</p>
        `;

        if (resend) {
            const { error: emailError } = await resend.emails.send({
                from: 'Smile Source Supply <onboarding@resend.dev>', // The default sender allowed on Resend free tier
                // IMPORTANT: Resend free tier only lets you send emails TO the address you registered Resend with.
                to: ['metazhar.legion@gmail.com'], // Using your registered test email!
                subject: `Order Confirmation - Smile Source Supply`,
                html: htmlBody
            });
            
            if (emailError) {
                console.error("Resend API Error:", emailError);
            }
        } else {
            console.log("No RESEND_API_KEY provided. Development mode simulated email transmission.");
        }

        return { statusCode: 201, headers, body: JSON.stringify({ message: "Checkout complete.", order_id: orderId }) };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};

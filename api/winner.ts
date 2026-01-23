import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
        return new Response('Phone number required', { status: 400 });
    }

    try {
        // Basic normalization: remove spaces and dashes using simple regex if desired,
        // but here we trust the client sends it or we match loosely.
        // Ideally, we normalize both sides.
        const cleanPhone = phone.replace(/[\s-]/g, '');

        const { rows } = await sql`
        SELECT prize_name FROM prizes 
        WHERE phone = ${cleanPhone} OR phone = ${phone}
        LIMIT 1;
    `;

        if (rows.length > 0) {
            return new Response(JSON.stringify({ prize: rows[0].prize_name }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ prize: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

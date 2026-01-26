import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const password = formData.get('password');

        // Simple password protection (hardcoded for now, can be env var)
        if (password !== 'admin888') {
            return new Response('Unauthorized', { status: 401 });
        }

        if (!file) {
            return new Response('No file uploaded', { status: 400 });
        }

        const text = await file.text();
        const rows = text.trim().split('\n');
        let insertedCount = 0;

        // Optional: Truncate table before insert? 
        // User said "Update", usually implies "Replacement" or "Upsert".
        // Safest for "List will change" is DELETE ALL + INSERT if it's a full replacement.
        // Let's support a "replace" flag or just do upsert. 
        // Given the user wants "Convenience" and "List changes", full sync is best.
        // We will clear the table first if they request it, OR just upsert.
        // Let's stick to UPSERT for safety, but maybe a clear option is better?
        // Let's loop through and UPSERT.

        for (const row of rows) {
            if (!row.trim()) continue;
            const cols = row.split(',').map(s => s.trim());
            if (cols.length < 5) continue;

            // CSV: Unit(Brand), Dept, Chinese, English, Prize
            const brand = cols[0];
            const chineseName = cols[2];
            const englishName = cols[3];
            const prize = cols[4];

            if (!englishName) continue;

            await sql`
            INSERT INTO prizes (english_name, chinese_name, brand, net_prize)
            VALUES (${englishName}, ${chineseName}, ${brand}, ${prize})
            ON CONFLICT (english_name) DO UPDATE SET 
                net_prize = EXCLUDED.net_prize,
                chinese_name = EXCLUDED.chinese_name,
                brand = EXCLUDED.brand;
        `;
            insertedCount++;
        }

        return new Response(JSON.stringify({
            message: 'Updated successfully',
            count: insertedCount
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

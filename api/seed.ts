import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    try {
        // 1. Create Table
        await sql`
      CREATE TABLE IF NOT EXISTS prizes (
        phone VARCHAR(50) PRIMARY KEY,
        prize_name VARCHAR(255) NOT NULL,
        is_claimed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        // 2. Insert Initial Data (Upsert to avoid duplicates)
        // You can modify this list before visiting the /api/seed URL
        const initialPrizes = [
            { phone: '0912345678', prize: '頭獎：現金 10 萬元' },
            { phone: '0987654321', prize: '二獎：iPhone 15 Pro Max' },
            { phone: '0911222333', prize: '三獎：Dyson 全套組' },
            { phone: '0921717796', prize: '特別獎：祥獅獻瑞大紅包' },
        ];

        for (const item of initialPrizes) {
            await sql`
            INSERT INTO prizes (phone, prize_name)
            VALUES (${item.phone}, ${item.prize})
            ON CONFLICT (phone) DO UPDATE SET prize_name = EXCLUDED.prize_name;
        `;
        }

        return new Response(JSON.stringify({ message: 'Database seeded successfully' }), {
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

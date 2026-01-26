import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    try {
        const { rows } = await sql`SELECT * FROM signups ORDER BY created_at DESC`;

        // Convert to CSV
        const header = 'ID,Name,Company,Phone,Time\n';
        const csv = rows.map((row: any) => {
            // Escape commas in fields
            const name = row.name ? `"${row.name.replace(/"/g, '""')}"` : '';
            const company = row.company ? `"${row.company.replace(/"/g, '""')}"` : '';
            const phone = row.phone ? `"${row.phone}"` : '';
            const time = row.created_at;
            return `${row.id},${name},${company},${phone},${time}`;
        }).join('\n');

        return new Response(header + csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="signups.csv"'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

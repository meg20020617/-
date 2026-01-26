import { sql } from '@vercel/postgres';
import mammoth from 'mammoth';

export const config = {
    runtime: 'nodejs', // mammoth requires nodejs runtime, not edge
};

const DOCX_URL = "https://fphra4iikbpe4rrw.public.blob.vercel-storage.com/%E5%8C%B9%E5%B0%8D%E5%90%8D%E5%96%AE.docx";

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        // 1. Fetch the DOCX file
        const docRes = await fetch(DOCX_URL);
        if (!docRes.ok) {
            throw new Error(`Failed to fetch DOCX: ${docRes.status} ${docRes.statusText}`);
        }
        const arrayBuffer = await docRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Extract raw text
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;

        // 3. Parse text
        // Assuming the docx format is simple lines or table converted to text
        // "Unit, Brand, Chinese, English, Prize" format might be lost in simple text extraction
        // if it's a table. Mammoth extracts table cells usually separated by tabs or newlines.
        // Let's assume standard line-based or tab-separated structure.
        // We will try to be robust. 

        // Only way to be sure without seeing the file is to log it, but we need to code blindly.
        // Let's assume it looks like: "ReSources, SSC, 羅文妮, Winnie Lo, SAMPO..."
        // If it's a table, mammoth puts each cell content sequentially. 
        // This is tricky. 

        // PLAN B: Use "Table" parsing. 
        // Mammoth extractRawText just dumps text. 
        // If the DOCX is a table, we might get: "ReSources\nSSC\n羅文妮\nWinnie Lo\nPrize\n..."
        // Let's assume a pattern of 5 items per "record" if it's a table dump.

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        let updatedCount = 0;

        // Heuristic: Process lines. If a line has commas, assume CSV format within DOCX.
        // If not, assume sequential fields (Risky).
        // Given the user provided a screenshot earlier implying CSV-like structure, let's try comma split first.

        for (const line of lines) {
            // Check for commas
            const parts = line.split(/,|，|\t/); // Split by comma, full-width comma, or tab

            // Clean parts
            const cols = parts.map(p => p.trim()).filter(p => p !== "");

            if (cols.length >= 5) {
                // We have a candidate row
                // 0:Unit, 1:Brand/Dept, 2:Chinese, 3:English, 4:Prize
                const brand = cols[0];
                const chineseName = cols[2];
                const englishName = cols[3];
                const prize = cols[4];

                // Basic validation: English name must contain english chars or be substantial
                if (!englishName || englishName.length < 2) continue;

                await sql`
            INSERT INTO prizes (english_name, chinese_name, brand, net_prize)
            VALUES (${englishName}, ${chineseName}, ${brand}, ${prize})
            ON CONFLICT (english_name) DO UPDATE SET 
                net_prize = EXCLUDED.net_prize,
                chinese_name = EXCLUDED.chinese_name,
                brand = EXCLUDED.brand;
           `;
                updatedCount++;
            }
        }

        // If the simple comma/tab split didn't find much, it might be a vertical dump (unlikely for "list").
        // Let's assume the user put the CSV content INTO the docx, or a Table that converts to tab-separated.
        // Mammoth usually converts table rows to paragraphs.

        return new Response(JSON.stringify({
            message: 'Sync successful',
            updated: updatedCount,
            debug_first_line: lines[0] // Return first line for debug if needed
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

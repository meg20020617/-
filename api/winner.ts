import mammoth from 'mammoth';

// Switch to Node.js runtime for mammoth support
export const config = {
    runtime: 'nodejs',
};

const DOCX_URL = "https://fphra4iikbpe4rrw.public.blob.vercel-storage.com/%E5%8C%B9%E5%B0%8D%E5%90%8D%E5%96%AE.docx";

export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
        return new Response(JSON.stringify({ error: 'Name is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 1. Fetch DOCX from Blob
        const response = await fetch(DOCX_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch prize list');
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Parse Text
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;

        // 3. Search for the Name
        // Heuristic: Parse lines and look for the english name
        const lines = text.split('\n');
        const searchName = name.trim();

        let foundPrize = null;

        for (const line of lines) {
            // Check if line contains comma (CSV style) or just look for the name
            if (!line.includes(searchName)) continue; // Case-sensitive better for Chinese? Or loose?

            // If line matches, let's parse it carefully
            // Expected format: Unit, Brand, Chinese, English, Prize

            const parts = line.split(/,|，|\t/);
            const cols = parts.map(p => p.trim()).filter(Boolean);

            // Heuristic for Chinese Name in Blob Data
            // We need to find the column that matches input 'searchName' (Chinese)

            // Usually [2] is Chinese based on previous context (Unit, Brand, Chinese...)
            // Let's iterate cols and see if any matches

            const matchIndex = cols.findIndex(c => c === searchName || c.replace(/\s/g, '') === searchName.replace(/\s/g, ''));

            if (matchIndex !== -1) {
                // If match found, look for Prize.
                // Prize is likely the last column or index 4.

                // If we found the name at index 2, prize is likely at index 4.
                // Or simply the last valid column.
                const potentialPrize = cols[cols.length - 1];

                // Sanity: Prize shouldn't be the name
                if (potentialPrize !== searchName) {
                    foundPrize = potentialPrize;
                    break;
                }
            }
        }

        return new Response(JSON.stringify({
            prize: foundPrize,
            source: 'blob_runtime'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Runtime Search Error:", error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

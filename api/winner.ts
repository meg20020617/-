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
        const searchName = name.trim().toLowerCase();

        let foundPrize = null;

        for (const line of lines) {
            // Check if line contains comma (CSV style) or just look for the name
            if (!line.toLowerCase().includes(searchName)) continue;

            // If line matches, let's parse it carefully
            // Expected format: Unit, Brand, Chinese, English, Prize
            // Or just a line with the name and prize.

            const parts = line.split(/,|，|\t/);
            const cols = parts.map(p => p.trim()).filter(Boolean);

            // We need to find which column is the English Name.
            // Usually index 3 based on previous examples.
            // But to be robust, let's see if any column *exactly* matches the search name (case-insensitive)

            const matchIndex = cols.findIndex(c => c.toLowerCase() === searchName);

            if (matchIndex !== -1) {
                // Determine Prize Column. Usually the last one or index 4.
                // If we found the name at index 3, prize is likely at index 4.
                // If cols length is > matchIndex + 1, take the next one or the last one.

                // Let's assume the prize is the LAST column if it's not the name itself.
                const potentialPrize = cols[cols.length - 1];

                // Sanity check: Prize shouldn't be the name
                if (potentialPrize.toLowerCase() !== searchName) {
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

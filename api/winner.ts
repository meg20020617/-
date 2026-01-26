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
    const company = searchParams.get('company');

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

        // 3. Search for the Name AND Company
        const lines = text.split('\n');
        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        let foundPrize = null;

        for (const line of lines) {
            if (!line.includes(searchName)) continue;

            const parts = line.split(/,|，|\t/);
            const cols = parts.map(p => p.trim()).filter(Boolean);

            // Check Name Match (Chinese)
            const nameMatch = cols.some(c => c === searchName || c.replace(/\s/g, '') === searchName.replace(/\s/g, ''));

            if (nameMatch) {
                // Check Company Match (if provided)
                // Heuristic: Company is usually col 0 (Unit) or 1 (Brand).
                // We check if ANY other column (up to index 2 or 3) generally matches the searchCompany.
                // Or simply check if the line contains the company string (fuzzier but safer for "Publicis" vs "Publicis Groupe")

                let companyMatch = true;
                if (searchCompany) {
                    // Check if 'line' contains the company (case insensitive)
                    // If dropdown is 'Publicis', it matches 'Publicis Media', 'Publicis Groupe', etc.
                    if (!line.toLowerCase().includes(searchCompany)) {
                        companyMatch = false;
                    }
                }

                if (companyMatch) {
                    const potentialPrize = cols[cols.length - 1];
                    if (potentialPrize !== searchName) {
                        foundPrize = potentialPrize;
                        break;
                    }
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

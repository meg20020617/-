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

        // 3. Search for the Name AND Company using Line Pattern
        // Debug analysis shows pattern per person (4 lines):
        // 1. Prize + Unit (e.g. "新光三越3000禮券LEO")
        // 2. Department/Brand code (e.g. "CR")
        // 3. Chinese Name (e.g. "楊乃菁")
        // 4. English Name (e.g. "Jin Yang")

        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        let foundPrize = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match Chinese Name (Exact match)
            if (line === searchName) {
                // Potential match found at index i
                // Check context. We expect Prize at i-2
                if (i < 2) continue; // Should have preceding lines

                const prizeLine = lines[i - 2] || "";
                const deptLine = lines[i - 1] || "";

                // --- Company Validation ---
                if (searchCompany) {
                    const matchInPrize = prizeLine.toLowerCase().includes(searchCompany);
                    const matchInDept = deptLine.toLowerCase().includes(searchCompany);
                    // Also check if searchCompany is part of the Unit suffix

                    if (!matchInPrize && !matchInDept) {
                        continue; // Name found, but Company doesn't match this entry
                    }
                }

                // --- Extract Prize ---
                // "新光三越3000禮券ReSources" -> Remove "ReSources"
                // Heuristic: remove trailing English/Symbols
                // But keep numbers if inside (e.g. 3000)
                // Regex: remove [a-zA-Z\s&]+ at the END of string

                const cleanPrize = prizeLine.replace(/[a-zA-Z\s&]+$/, '').trim();
                foundPrize = cleanPrize;
                break;
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

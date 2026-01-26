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

        // 3. Search for the Name (Relaxed Match)
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        // Find ALL candidates first
        let candidates: { prize: string, companyContext: string, index: number }[] = [];

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === searchName) {
                // Heuristic: Prize is i-2, Unit/Dept is i-1
                if (i < 2) continue;
                const prizeLine = lines[i - 2] || "";
                const deptLine = lines[i - 1] || "";

                // Clean Prize
                const cleanPrize = prizeLine.replace(/[a-zA-Z\s&]+$/, '').trim();

                // Company Context (Unit + Dept)
                const context = (prizeLine + " " + deptLine).toLowerCase();

                candidates.push({ prize: cleanPrize, companyContext: context, index: i });
            }
        }

        let bestMatch = null;

        if (candidates.length === 0) {
            // No match found
        } else if (candidates.length === 1) {
            // Unique name match! Trust it even if company doesn't strictly match.
            // (Unless it's a huge mismatch, but for now we trust the name)
            bestMatch = candidates[0].prize;
        } else {
            // Multiple matches (same name). Filter by Company.
            if (searchCompany) {
                const exact = candidates.find(c => c.companyContext.includes(searchCompany));
                if (exact) bestMatch = exact.prize;
                else bestMatch = candidates[0].prize; // Fallback to first
            } else {
                bestMatch = candidates[0].prize;
            }
        }

        let foundPrize = null;
        if (bestMatch) foundPrize = bestMatch;

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

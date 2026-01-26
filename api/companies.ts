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

    try {
        const response = await fetch(DOCX_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch prize list');
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const companies = new Set<string>();

        // Heuristic: 4-line block per person
        // Line 0: Prize + Unit (e.g. "PrizeLEO")
        // Line 1: Dept (e.g. "CR")
        // Line 2: Chi
        // Line 3: Eng

        for (let i = 0; i < lines.length; i += 4) {
            const prizeLine = lines[i];
            // Extract suffix from prizeLine to get Company
            // Regex: Catch trailing English words
            const match = prizeLine && prizeLine.match(/([a-zA-Z\s&]+)$/);
            if (match && match[1]) {
                const company = match[1].trim();
                // Filter out small garbage or non-companies if needed
                if (company.length > 1) {
                    companies.add(company);
                }
            }
        }

        const sorted = Array.from(companies).sort();

        return new Response(JSON.stringify({
            companies: sorted
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Runtime Company Fetch Error:", error);
        // Fallback list just in case
        return new Response(JSON.stringify({
            companies: [
                "LEO", "Starcom", "Zenith", "Prodigious", "Digitas",
                "Performics", "MSL", "PMX", "Saatchi & Saatchi",
                "ReSources", "Publicis", "Human Resource", "Finance",
                "Administration", "Management", "Growth Intelligence",
                "Collective", "Commercial"
            ].sort()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

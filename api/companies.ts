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
        const lines = text.split('\n');

        const companies = new Set<string>();

        // Heuristic:
        // Parse each line. We assume the "Brand" or "Company" is likely the 2nd column (index 1)
        // Format: Unit, Brand, Chinese Name, English Name, Prize
        // Example: Publicis, LEO, 王小明, Leo Wang, 200元

        for (const line of lines) {
            const parts = line.split(/,|，|\t/);
            const cols = parts.map(p => p.trim()).filter(Boolean);

            if (cols.length < 3) continue; // Skip empty/header likely

            // Let's grab the Brand (Index 1) or Unit (Index 0)? 
            // The user's hardcoded list had "LEO", "publicis", "Digitas" etc.
            // These look like Brands.

            // Allow collecting both? Or just Index 1?
            // Let's try to collect Index 1. 
            // But sometimes the file might have headers.
            // We can filter out known headers if needed, or just collect all unique strings in that column.

            const brand = cols[1];
            if (brand && brand.length > 1 && !brand.includes('名稱') && !brand.includes('Brand')) {
                companies.add(brand);
            }

            // Also add Unit if it looks like a brand? 
            // Let's stick to index 1 for now as primary suspect for "Brand".
            // If the user wants "Unit" (Index 0), we might miss it.
            // Let's add Index 0 too if it's in the previous hardcoded keys.
            const unit = cols[0];
            if (unit && unit.length > 1 && !unit.includes('單位') && !unit.includes('Unit')) {
                companies.add(unit);
            }
        }

        // Filter out obviously non-company strings if needed (like "Name", "Prize")
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

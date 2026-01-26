export const config = {
    runtime: 'nodejs',
};

const DATA_URL = "https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E4%B8%AD%E7%8D%8E%E5%90%8D%E5%96%AE.csv";

// Helper: Parse a single CSV line handling quotes
function parseCSVLine(text: string) {
    const res = [];
    let entry = [];
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            res.push(entry.join('').trim());
            entry = [];
        } else {
            entry.push(char);
        }
    }
    // Last entry
    res.push(entry.join('').trim());
    return res;
}

export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch prize list');
        }

        // FORCE UTF-8
        const arrayBuffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        const cleanText = text.replace(/^\uFEFF/, '');

        const lines = cleanText.split('\n').filter(l => l.trim().length > 0);

        const companies = new Set<string>();

        // Skip Header (Row 0)
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            // Company is Index 9 based on analysis
            const comp = row[9];

            if (comp && comp !== '無' && comp.length > 1) {
                const cleanComp = comp.replace(/['"]/g, '').trim();
                // Filter out obviously non-company strings if needed
                if (cleanComp && cleanComp !== '-') {
                    companies.add(cleanComp);
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
        // Fallback list
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

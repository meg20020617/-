export const config = {
    runtime: 'edge',
};

const DATA_URL = "https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E6%99%AE%E7%8D%8EFinal_%E7%8D%8E%E9%A0%85%E6%B8%85%E5%96%AE-20260130.csv";

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

        const arrayBuffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

        const lines = cleanText.split('\n').filter(l => l.trim().length > 0);

        const companies = new Set<string>();

        // Skip Header (Row 0)
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            // Structure: 0:ID, 1:Count, 2:Prize, 3:Voucher, 4:Name, 5:Company
            if (row.length < 6) continue;

            const comp = row[5];

            if (comp && comp !== '無' && comp.length > 1) {
                const cleanComp = comp.replace(/[\u4e00-\u9fa5]/g, '').trim();

                // Exclude Publicis and ReSources as requested
                if (cleanComp && cleanComp !== '-' && cleanComp.length > 1) {
                    if (cleanComp.toLowerCase() === 'publicis' || cleanComp.toLowerCase().includes('resource')) {
                        continue;
                    }
                    companies.add(cleanComp);
                }
            }
        }

        // Ensure SSC is valid
        if (!companies.has("SSC")) {
            companies.add("SSC");
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
                "SSC", "Human Resource", "Finance",
                "Administration", "Management", "Growth Intelligence",
                "Collective", "Commercial", "Spark", "Core"
            ].sort()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

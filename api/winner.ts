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
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch prize list');
        }

        // FORCE UTF-8 DECODING
        const arrayBuffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);

        // Remove BOM if present
        const cleanText = text.replace(/^\uFEFF/, '');

        const lines = cleanText.split('\n').filter(l => l.trim().length > 0);

        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        // Collect ALL matched prizes (Support for multiple rows)
        let matchedPrizes: string[] = [];

        // Skip Header (Row 0)
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length < 9) continue;

            const rowName = row[8];
            const rowCompany = row[9];

            if (!rowName) continue;

            // Name Match check
            if (rowName === searchName) {

                // Company Check
                // Currently DISABLED strict checking as per previous instruction to "not make things difficult"
                // BUT user said "Have to match company" ("不行 也要比對公司") in later prompts.
                // So I will RE-ENABLE it but keep it robust (ignore space/case).

                if (searchCompany && rowCompany) {
                    const rowCompClean = rowCompany.toLowerCase().replace(/\s/g, '');
                    const searchCompClean = searchCompany.replace(/\s/g, '');

                    if (!rowCompClean.includes(searchCompClean) && !searchCompClean.includes(rowCompClean)) {
                        continue; // Mismatch
                    }
                }

                // Construct Prize Name
                let prizeName = row[2];

                // If "禮券", construct a nicer name
                if (prizeName.includes('禮券') || row[1].includes('禮券')) {
                    const brand = row[6]; // Index 6
                    const amount = row[7]; // Index 7

                    let parts = [];
                    if (brand && brand !== '無' && brand !== '-') parts.push(brand);
                    if (amount && amount !== '-') parts.push(amount.replace(/['"]/g, '').trim() + '元');

                    // Avoid duplicating "禮券" if already in prizeName
                    if (!prizeName.includes('禮券')) parts.push(prizeName);
                    else {
                        // If prizeName is just "禮券", we use parts. If it's "SOGO禮券", we keep it.
                        if (prizeName === '禮券') parts.push('禮券');
                        else parts.push(prizeName);
                    }

                    const uniqueParts = [...new Set(parts)];
                    if (uniqueParts.length > 0) prizeName = uniqueParts.join(' ');
                }

                if (prizeName) {
                    matchedPrizes.push(prizeName.replace(/['"]/g, '').trim());
                }
            }
        }

        let finalPrize = null;
        if (matchedPrizes.length > 0) {
            // Join multiples with " + "
            // Deduplicate exact strings
            const uniquePrizes = [...new Set(matchedPrizes)];
            finalPrize = uniquePrizes.join(' + ');
        }

        return new Response(JSON.stringify({
            prize: finalPrize,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Winner Algorithm Error:", error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

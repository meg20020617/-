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
        const cleanText = text.replace(/^\uFEFF/, ''); // Remove BOM

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
                if (searchCompany && rowCompany) {
                    const rowCompClean = rowCompany.toLowerCase().replace(/\s/g, '');
                    const searchCompClean = searchCompany.replace(/\s/g, '');

                    if (!rowCompClean.includes(searchCompClean) && !searchCompClean.includes(rowCompClean)) {
                        continue; // Mismatch
                    }
                }

                // Construct Prize Name
                let prizeName = row[2];
                if (prizeName.includes('禮券') || row[1].includes('禮券')) {
                    const brand = row[6]; // Index 6
                    const amount = row[7]; // Index 7

                    let parts = [];
                    if (brand && brand !== '無' && brand !== '-') parts.push(brand);
                    if (amount && amount !== '-') parts.push(amount.replace(/['"]/g, '').trim() + '元');

                    if (!prizeName.includes('禮券')) parts.push(prizeName);
                    else {
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
            const uniquePrizes = [...new Set(matchedPrizes)];
            finalPrize = uniquePrizes.join(' + ');
        } else {
            // DEBUG: If failed, return valuable info about what the server received
            // Use very careful encoding logging
            const nameHex = searchName.split('').map(c => c.charCodeAt(0).toString(16)).join(' ');

            // Scan for partial matches
            let scanResult = "No partial match.";
            for (let i = 1; i < lines.length && i < 300; i++) {
                const r = parseCSVLine(lines[i]);
                if (i === 269) {
                    scanResult = `Row 269 Name: '${r[8]}' (${r[8].split('').map(c => c.charCodeAt(0).toString(16)).join(' ')}). Company: '${r[9]}'`;
                }
            }

            finalPrize = `DEBUG: Server received '${searchName}' (Hex: ${nameHex}). ${scanResult}`;
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

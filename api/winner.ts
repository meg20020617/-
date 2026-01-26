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
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim().length > 0);

        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        let foundPrize = null;

        // Skip Header (Row 0)
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length < 9) continue;

            // Mapping based on debug analysis:
            // Index 2: Prize Name
            // Index 8: Name
            // Index 9: Company

            const rowName = row[8];
            const rowCompany = row[9];
            let prizeName = row[2];

            if (!rowName) continue;

            const nameMatch = rowName.trim() === searchName;

            if (nameMatch) {
                // Company Check
                if (searchCompany && rowCompany) {
                    const rowCompClean = rowCompany.toLowerCase().replace(/\s/g, '');
                    const searchCompClean = searchCompany.replace(/\s/g, '');

                    // Relaxed match: includes
                    if (!rowCompClean.includes(searchCompClean) && !searchCompClean.includes(rowCompClean)) {
                        // Strict validation requested, so skip if mismatch
                        continue;
                    }
                }

                // Construct Prize Name if "禮品" or "禮券"
                // Col 1: Type
                // Col 6: Voucher Brand (Index 6? Check debug)
                // Wait, debug Row 4: `"无"`, index 6? 
                // Row 4: 0,1,2,3,4,5,6,7,8,9
                // 4, 禮品, tokuyo..., "3,980", 1, "3,980", 無(Index 6), -(Index 7), Name(8), Comp(9)

                // Let's re-verify indices from debug output for the "Voucher" row (Row 1 from previous debug?)
                // Previous XLSX debug said Row 269: [..., "新光三越"(7), 3000(8) ... ]
                // CSV might be slightly different?
                // CSV Row 1 (from debug_csv output): `1,禮品,LG...,...,...,...,無,-,李桂甄,SSC`
                // 0: 1
                // 1: 禮品
                // 2: LG...
                // 6: 無 (Brand?)
                // 7: - (Amount?)
                // 8: Name
                // 9: Comp

                // Let's rely on `row[2]` (Item Name) primarily.
                // If row[2] is just "禮券", we might need the other cols.
                // Assuming "新光三越" is at index 6 or 7?
                // Let's try to grab them if needed.

                if (prizeName === '禮券' || row[1] === '禮券') {
                    const brand = row[6]; // Guessing based on "無" position
                    const amount = row[7]; // Guessing based on "-" position

                    // If it looks like a brand...
                    let parts = [];
                    if (brand && brand !== '無' && brand !== '-') parts.push(brand);
                    // Amount might be quoted " 3,000 "
                    if (amount && amount !== '-') parts.push(amount.replace(/['"]/g, '').trim() + '元');

                    parts.push(prizeName);
                    if (parts.length > 1) prizeName = parts.join(' ');
                }

                foundPrize = prizeName.replace(/['"]/g, '').trim(); // Remove clean quotes
                break;
            }
        }

        return new Response(JSON.stringify({
            prize: foundPrize,
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

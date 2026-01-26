export const config = {
    runtime: 'edge',
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

        let lines: string[] = [];
        try {
            const arrayBuffer = await response.arrayBuffer();
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(arrayBuffer);
            const cleanText = text.replace(/^\uFEFF/, '');
            lines = cleanText.split('\n').filter(l => l.trim().length > 0);
        } catch (decodeErr: any) {
            throw new Error("Decoding Failed: " + decodeErr.message);
        }

        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        let matchedPrizes: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length < 9) continue;

            const rowName = row[8] || "";
            const rowCompany = row[9] || "";

            if (!rowName) continue;

            // 1. Company Match Check (Priority as requested)
            if (searchCompany) {
                const rowCompClean = rowCompany.toLowerCase().replace(/\s/g, '');
                const searchCompClean = searchCompany.replace(/\s/g, '');

                // If company doesn't match, skip row immediately
                if (!rowCompClean.includes(searchCompClean) && !searchCompClean.includes(rowCompClean)) {
                    continue;
                }
            }

            // 2. Name Match Check
            if (rowName !== searchName) continue;

            // 3. Prize Construction
            let prizeName = row[2] || "";
            if (prizeName.includes('禮券') || (row[1] && row[1].includes('禮券'))) {
                const brand = row[6];
                const amount = row[7];

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

        let finalPrize = null;
        if (matchedPrizes.length > 0) {
            const uniquePrizes = [...new Set(matchedPrizes)];
            // Use ' + ' with spacing for readability
            finalPrize = uniquePrizes.join(' ✚ ');
        } else {
            // DEBUG LOGIC (Protected)
            try {
                const nameHex = searchName.split('').map(c => c.charCodeAt(0).toString(16)).join(' ');

                let scanResult = "No Row 269 found (Lines < 269).";
                if (lines.length > 269) {
                    const r = parseCSVLine(lines[269]);
                    const rName = r[8] || "(undefined)";
                    const rComp = r[9] || "(undefined)";
                    const rNameHex = rName.split('').map(c => c.charCodeAt(0).toString(16)).join(' ');
                    scanResult = `Row 269 Name: '${rName}' (Hex: ${rNameHex}). Comp: '${rComp}'`;
                }

                // Only show detailed debug if name contains specialized chars or match failed mysteriously
                finalPrize = `DEBUG: Server received '${searchName}' (Hex: ${nameHex}). ${scanResult}`;
            } catch (debugErr: any) {
                finalPrize = `DEBUG: Crash in debug logic: ${debugErr.message}`;
            }
        }

        return new Response(JSON.stringify({
            prize: finalPrize,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        const msg = `DEBUG: CRITICAL_ERROR ${error.message}`;
        return new Response(JSON.stringify({
            prize: msg,
            error: error.message
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

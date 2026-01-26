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

            // 1. Company Match (Priority)
            if (searchCompany) {
                const rowCompClean = rowCompany.toLowerCase().replace(/\s/g, '');
                const searchCompClean = searchCompany.replace(/\s/g, '');

                if (!rowCompClean.includes(searchCompClean) && !searchCompClean.includes(rowCompClean)) {
                    continue;
                }
            }

            // 2. Name Match
            if (rowName !== searchName) continue;

            // 3. Prize Construction (Hybrid Logic)
            let rawPrize = row[2] || "";
            let extraVoucher = "";

            const brand = row[6];
            const amount = row[7];

            if (brand && brand !== '無' && brand !== '-' && brand.trim().length > 0) {
                const amtStr = (amount && amount !== '-') ? amount.replace(/['"]/g, '').trim() + '元' : '';
                extraVoucher = `${brand} ${amtStr} 禮券`.trim();
            }

            let prizeForThisRow = rawPrize;

            if (rawPrize === '禮券' || rawPrize.includes('禮券')) {
                if (extraVoucher) prizeForThisRow = extraVoucher;
            } else {
                if (extraVoucher) {
                    // SEPARATOR ||| 
                    prizeForThisRow = `${rawPrize}|||+${extraVoucher}`;
                }
            }

            if (prizeForThisRow) {
                matchedPrizes.push(prizeForThisRow.replace(/['"]/g, '').trim());
            }
        }

        let finalPrize = null;
        if (matchedPrizes.length > 0) {
            const uniquePrizes = [...new Set(matchedPrizes)];
            // SEPARATOR ||| for Multiples
            finalPrize = uniquePrizes.join('|||');
        } else {
            finalPrize = null;
        }

        return new Response(JSON.stringify({
            prize: finalPrize,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

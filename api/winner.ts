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
            // Replace BOM and normalize newlines
            const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
            lines = cleanText.split('\n').filter(l => l.trim().length > 0);
        } catch (decodeErr: any) {
            throw new Error("Decoding Failed: " + decodeErr.message);
        }

        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        let matchedPrizes: string[] = [];
        let matchedIds: string[] = [];

        // Skip header (i=1)
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length < 10) continue;

            // Index 8: Name, Index 9: Company
            const rowId = row[0];
            const rowPrize = row[2];

            // Voucher logic
            const vBrand = row[6]; // e.g., 家樂福
            const vAmt = row[7];   // e.g., 1,500

            const rowName = row[8];
            const rowCompany = row[9];

            if (!rowName) continue;

            // 1. Company Match (Priority)
            if (searchCompany && rowCompany) {
                const rowCompClean = rowCompany.toLowerCase().replace(/\s/g, '');
                const searchCompClean = searchCompany.replace(/\s/g, '');

                if (!rowCompClean.includes(searchCompClean) && !searchCompClean.includes(rowCompClean)) {
                    continue;
                }
            }

            // 2. Name Match
            if (rowName !== searchName) continue;

            // 3. Prize Construction
            let finalPrizeStr = "";
            let pItem = rowPrize ? rowPrize.trim() : "";
            let vItem = "";

            if (vBrand && vBrand !== '無' && vBrand.trim() !== '') {
                // If amount exists and is not '-'
                if (vAmt && vAmt.trim() !== '-' && vAmt.trim() !== '') {
                    const amtClean = vAmt.replace(/['"]/g, '').trim();
                    vItem = `${vBrand} ${amtClean}元 禮券`;
                } else {
                    // Just brand?
                    vItem = `${vBrand} 禮券`;
                }
            }

            // Logic Refinement:
            // If pItem is just "禮券" (generic placeholder) and we have specific voucher info, 
            // ONLY show the voucher info.
            if (pItem === '禮券' && vItem) {
                finalPrizeStr = vItem;
            } else if (pItem && vItem) {
                finalPrizeStr = `${pItem}|||+${vItem}`;
            } else if (pItem) {
                finalPrizeStr = pItem;
            } else if (vItem) {
                finalPrizeStr = vItem;
            }

            if (finalPrizeStr) {
                matchedPrizes.push(finalPrizeStr);
                if (rowId) matchedIds.push(rowId.trim());
            }
        }

        let finalPrize = null;
        let finalId = null;

        if (matchedPrizes.length > 0) {
            // Dedup prizes
            const uniquePrizes = [...new Set(matchedPrizes)];
            finalPrize = uniquePrizes.join('|||');

            // Dedup IDs
            const uniqueIds = [...new Set(matchedIds)];
            finalId = uniqueIds.join(', ');
        } else {
            finalPrize = null;
        }

        return new Response(JSON.stringify({
            prize: finalPrize,
            id: finalId,
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

import * as XLSX from 'xlsx';

// Switch to Node.js runtime for xlsx support
export const config = {
    runtime: 'nodejs',
};

const DOCX_URL = "https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E6%99%AE%E7%8D%8E(%E6%9C%AAFinal).xlsx";

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
        // 1. Fetch XLSX from Blob
        const response = await fetch(DOCX_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch prize list');
        }
        const arrayBuffer = await response.arrayBuffer();

        // 2. Parse XLSX
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Assuming first sheet
        const sheet = workbook.Sheets[sheetName];

        // Convert to array of arrays
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        // 3. Search Logic

        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        let foundPrize = null;

        // Start from row 1 (skip header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 3) continue;

            let prizeName = row[2]; // Col 2: Prize (Index 2)
            const userInfo = row[row.length - 1]; // Last Col: Info

            if (typeof userInfo !== 'string') continue;

            const userInfoLower = userInfo.toLowerCase();
            const searchNameLower = searchName.toLowerCase();

            // Check Chinese Name Match (Case insensitive just in case)
            if (userInfoLower.includes(searchNameLower)) {

                // Company Check
                if (searchCompany) {
                    if (!userInfoLower.includes(searchCompany)) {
                        continue;
                    }
                }

                // Construct Better Prize Name for Vouchers
                // Row structure based on debug:
                // Col 1: Type ("禮品" or "禮券") - Index 1
                // Col 2: Item ("LG..." or "禮券") - Index 2
                // Col 7: Brand ("新光三越") - Index 7
                // Col 8: Amount (3000) - Index 8

                const type = row[1];
                const brand = row[7];
                const amount = row[8];

                // If it is a generic "Voucher" entry, construct a better name
                if (type === '禮券' || prizeName === '禮券') {
                    // Construct: "新光三越 3000元 禮券"
                    let parts = [];
                    if (brand && brand !== '無') parts.push(brand);
                    if (amount) parts.push(`${amount}元`);
                    parts.push('禮券');

                    if (parts.length > 1) {
                        prizeName = parts.join(' ');
                    }
                }

                if (prizeName) {
                    foundPrize = prizeName;
                    break;
                }
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

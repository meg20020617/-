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
        // Structure based on debug:
        // Col 2 (Index 2): Prize Name ("LG ...")
        // Last Col (Index 9 or 10): User Info (" Jane Lee 李桂甄 SSC")

        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        let foundPrize = null;

        // Start from row 1 (skip header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 3) continue;

            const prizeName = row[2]; // Col 2: Prize
            const userInfo = row[row.length - 1]; // Last Col: Info

            if (typeof userInfo !== 'string') continue;

            // Check Chinese Name Match
            // User info format: " EngName ChiName Company"
            if (userInfo.includes(searchName)) {

                // Company Check
                if (searchCompany) {
                    if (!userInfo.toLowerCase().includes(searchCompany)) {
                        continue;
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

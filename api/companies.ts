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

    try {
        const response = await fetch(DOCX_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch prize list');
        }
        const arrayBuffer = await response.arrayBuffer();

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        const companies = new Set<string>();

        // Row 1 onwards
        // Last Column: " Jane Lee 李桂甄 SSC"
        // Need to extract "SSC"

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const userInfo = row[row.length - 1]; // Last col

            if (typeof userInfo === 'string') {
                const parts = userInfo.trim().split(/\s+/);
                const last = parts[parts.length - 1]; // Heuristic: Company is last word

                // Refined Heuristic:
                // Check if last part is NOT Chinese (company usually English abbr like SSC, PMX)
                // If contains Chinese, maybe it's part of name? 
                // "李桂甄" -> Chinese
                // "SSC" -> Eng
                if (last && !/[\u4e00-\u9fa5]/.test(last) && last.length > 1) {
                    companies.add(last);
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
        // Fallback list just in case
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

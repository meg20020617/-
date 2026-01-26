export const config = {
    runtime: 'nodejs',
};

const DATA_URL = "https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E4%B8%AD%E7%8D%8E%E5%90%8D%E5%96%AE.csv";

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

    if (!name) return new Response('Name required', { status: 400 });

    try {
        const response = await fetch(DATA_URL);
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim().length > 0);

        const searchName = name.trim();
        const searchCompany = company ? company.trim().toLowerCase() : '';

        const logs = [];

        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            const rowName = row[8];
            const rowCompany = row[9];

            // Log matching attempts
            if (rowName && rowName.includes(searchName)) { // Loose match for logging
                const logEntry: any = {
                    rowIndex: i,
                    rowName,
                    rowCompany,
                    searchName,
                    searchCompany,
                    exactNameMatch: rowName === searchName,
                };

                if (searchCompany && rowCompany) {
                    const rowCompClean = rowCompany.toLowerCase().replace(/\s/g, '');
                    const searchCompClean = searchCompany.toLowerCase().replace(/\s/g, ''); // Ensure lower

                    logEntry.rowCompClean = rowCompClean;
                    logEntry.searchCompClean = searchCompClean;
                    logEntry.match1 = rowCompClean.includes(searchCompClean);
                    logEntry.match2 = searchCompClean.includes(rowCompClean);
                }

                logs.push(logEntry);
            }
        }

        return new Response(JSON.stringify({ logs }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

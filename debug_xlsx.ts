import * as XLSX from 'xlsx';

async function debug() {
    const XLSX_URL = "https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E6%99%AE%E7%8D%8E(%E6%9C%AAFinal).xlsx";
    try {
        console.log("Fetching XLSX...");
        const response = await fetch(XLSX_URL);
        const arrayBuffer = await response.arrayBuffer();

        console.log("Parsing...");
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        console.log(`Searching for "薛詳臻"...`);

        rows.forEach((row, i) => {
            const userInfo = row[row.length - 1];
            if (typeof userInfo === 'string' && userInfo.includes("薛詳臻")) {
                console.log(`FOUND at Row ${i}:`);
                console.log(`Full Row:`, JSON.stringify(row));
                console.log(`User Info Col: "${userInfo}"`);

                // Simulate check
                const searchCompany = "digitas";
                const match = userInfo.toLowerCase().includes(searchCompany);
                console.log(`Match "digitas"? ${match}`);
            }
        });

    } catch (e) {
        console.error(e);
    }
}

debug();

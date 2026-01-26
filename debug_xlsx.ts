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

        // Convert to JSON (array of arrays)
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log(`Sheet Name: ${sheetName}`);
        console.log(`Total Rows: ${rows.length}`);
        console.log("=== First 5 Rows ===");
        rows.slice(0, 5).forEach((row, i) => {
            console.log(`Row ${i}:`, JSON.stringify(row));
        });

    } catch (e) {
        console.error(e);
    }
}

debug();

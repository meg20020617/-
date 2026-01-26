
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

async function debug() {
    const CSV_URL = "https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E4%B8%AD%E7%8D%8E%E5%90%8D%E5%96%AE.csv";
    try {
        console.log("Fetching CSV...");
        const response = await fetch(CSV_URL);
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim().length > 0);

        console.log(`Total Rows: ${lines.length}`);

        console.log("Searching for '薛詳臻'...");
        let foundCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            const name = row[8];
            const comp = row[9];

            if (name && name.includes("薛詳臻")) {
                foundCount++;
                console.log(`[Match ${foundCount}] Row ${i}:`);
                console.log(`  Raw: ${lines[i]}`);
                console.log(`  Parsed Name: '${name}'`);
                console.log(`  Parsed Comp: '${comp}'`);
                console.log(`  Col 1 (Type): '${row[1]}'`);
                console.log(`  Col 2 (Prize): '${row[2]}'`);
                console.log(`  Col 6 (Brand?): '${row[6]}'`);
                console.log(`  Col 7 (Amt?): '${row[7]}'`);
            }
        }

        if (foundCount === 0) console.log("NO MATCHES FOUND FOR '薛詳臻'");

    } catch (e) {
        console.error(e);
    }
}

debug();

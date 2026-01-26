
async function debug() {
    const CSV_URL = "https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E4%B8%AD%E7%8D%8E%E5%90%8D%E5%96%AE.csv";
    try {
        console.log("Fetching CSV...");
        const response = await fetch(CSV_URL);
        const text = await response.text();

        console.log("Parsing...");
        const lines = text.split('\n').filter(l => l.trim().length > 0);

        console.log(`Total Rows: ${lines.length}`);
        console.log("=== First 10 Lines ===");
        lines.slice(0, 10).forEach((line, i) => {
            console.log(`Row ${i}: ${line}`);
        });

        // Also check if quotes are used
        console.log("\n=== Checking for quotes ===");
        if (lines[1]) {
            console.log(`Row 1 split by comma:`, lines[1].split(','));
        }

    } catch (e) {
        console.error(e);
    }
}

debug();

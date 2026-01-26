import mammoth from 'mammoth';

async function debug() {
    const DOCX_URL = "https://fphra4iikbpe4rrw.public.blob.vercel-storage.com/%E5%8C%B9%E5%B0%8D%E5%90%8D%E5%96%AE.docx";
    try {
        console.log("Fetching DOCX...");
        const response = await fetch(DOCX_URL);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log("Parsing...");
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;
        const lines = text.split('\n').filter(l => l.trim().length > 0);

        console.log(`Total non-empty lines: ${lines.length}`);
        console.log("=== First 20 Lines ===");
        lines.slice(0, 20).forEach((line, i) => {
            console.log(`Line ${i}: ${line}`);
            // split by common delimiters
            const vals = line.split(/,|，|\t/).map(v => v.trim());
            console.log(`  Values:`, vals);
        });

    } catch (e) {
        console.error(e);
    }
}

debug();

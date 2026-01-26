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

        console.log(`Searching for "薛詳臻"...`);

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("薛詳臻")) {
                console.log(`FOUND at index ${i}`);
                console.log(`Context:`);
                console.log(`  [i-3] ${lines[i - 3]}`);
                console.log(`  [i-2] ${lines[i - 2]}`);
                console.log(`  [i-1] ${lines[i - 1]}`);
                console.log(`  [i]   ${lines[i]}`); // This line
                console.log(`  [i+1] ${lines[i + 1]}`);
                console.log(`  [i+2] ${lines[i + 2]}`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

debug();

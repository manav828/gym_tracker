import { GoogleGenAI } from "@google/genai";

// Usage: API_KEY=your_key node scripts/list_models.js
// Or set API_KEY in your environment

const apiKey = process.env.VITE_API_KEY || process.env.API_KEY;

if (!apiKey) {
    console.error("Error: API_KEY or VITE_API_KEY environment variable is not set.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        console.log("Fetching available models...");
        // @google/genai v1.30 might use a different method than listModels?
        // The standard google-generative-ai has ai.getGenerativeModel but for listing:
        // It seems @google/genai acts as a proxy or uses a models service.
        // Let's try the standard method or inspect.
        // Actually, usually it's not directly exposed on the client instance in some versions.
        // But let's try assuming standard structure or REST.

        // NOTE: The @google/genai package is actually the NEW ONE.
        // It has `ai.models.list()`.

        const response = await ai.models.list();

        console.log("\nAvailable Models:");
        // Response might be an async iterable or a list object
        if (response && response.models) {
            response.models.forEach(m => {
                console.log(`- ${m.name} (${m.displayName})`);
            });
        } else {
            // As it might be paginated or different structure
            console.log(JSON.stringify(response, null, 2));
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();

import OpenAI from "openai";
import * as fs from "node:fs"
import * as path from "path";

export class GPT {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({ apiKey: process.env.GPT_API_KEY });
    }

    async generateResponse(prompt: string): Promise<string | null> {
        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });

            const answer = response.choices[0]?.message?.content || null;

            // Log the prompt and response to a JSON file with a detailed timestamp in the logs folder
            const logsDir = path.join(__dirname, "..", "logs");
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir);
            }
            const logFilePath = path.join(logsDir, `log.json`);

            let logData = { inputs: [], outputs: [] };
            if (fs.existsSync(logFilePath)) {
                const existingData = fs.readFileSync(logFilePath, "utf8");
                logData = JSON.parse(existingData);
            }

            logData.inputs.push(prompt);
            logData.outputs.push(answer);

            fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), "utf8");

            return answer;
        } catch (error: any) {
            console.error("Error generating response:", error.message);
            return null;
        }
    }
}
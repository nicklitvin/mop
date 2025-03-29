import OpenAI from "openai";
import * as fs from "node:fs"
import * as path from "path";
import { format } from "date-fns"; // Add this import for timestamp formatting

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

            // Log the prompt and response to a timestamped file in the logs folder outside the current directory
            const logsDir = path.join(__dirname, "..", "logs");
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir);
            }
            const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
            const logFilePath = path.join(logsDir, `log_${timestamp}.txt`);
            const logEntry = `Q: ${prompt}\nA: ${answer}\n\n`;
            fs.writeFileSync(logFilePath, logEntry, "utf8");

            return answer;
        } catch (error: any) {
            console.error("Error generating response:", error.message);
            return null;
        }
    }
}
import OpenAI from "openai";

export class GPT {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({ apiKey: process.env.GPT_API_KEY })
    }

    async generateResponse(prompt: string): Promise<string | null> {
        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });

            return response.choices[0]?.message?.content || null;
        } catch (error: any) {
            console.error("Error generating response:", error.message);
            return null;
        }
    }
}
import OpenAI from "openai";

export class GPT {
    private client: OpenAI;

    constructor(private useMock: boolean = false) {
        this.client = new OpenAI({ apiKey: process.env.GPT_API_KEY });
        if (this.useMock) {
            console.log("Using mock GPT response.");
        }
    }

    async generateResponse(prompt: string): Promise<string | null> {
        if (this.useMock) {
            return JSON.stringify({
                title: "Sample MOP Title",
                description: "This is a sample description for the MOP.",
                prerequisites: ["Sample prerequisite 1", "Sample prerequisite 2"],
                steps: [
                    { action: "Do Action 1" },
                    { action: "Do Action 2" },
                ],
            });
        }

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
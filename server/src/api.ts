import { APIOutput } from "./types";
import { DB } from "./db";
import { MOP, Step } from "@prisma/client";
import { GPT } from "./gpt";

export class API {
    private db: DB;
    private gpt: GPT;

    constructor(useMock: boolean) {
        this.db = new DB();
        this.gpt = new GPT(useMock);
    }

    async hi(): Promise<APIOutput<string>> {
        return Promise.resolve({
            data: "hi"
        });
    }

    async createMOP(prompt: string): Promise<APIOutput<MOP>> {
        // Construct a detailed prompt for GPT
        const detailedPrompt = `
            You are tasked with creating a Methods of Procedure (MOP) for the following subject: "${prompt}".
            The MOP should include:
            - A title summarizing the procedure.
            - A concise, technical description of the procedure. For example: "To close the tie breaker between MSB B and MSB A so the load on MSB B can be fed from MSP A while a PM is being performed on the feeder to MSB B."
            - A list of prerequisites required to perform the procedure, including specific tools, equipment, or conditions necessary to complete the procedure. For example: "screwdriver", "rack unit (optional)".
            - A series of steps, where each step includes:
              - A single, specific, and atomic action that can be easily verified. Do not include "step 1", "step 2", etc. Just describe the action being taken.

            Format the response as a JSON object with the following structure (do not include \`\`\`json or any other formatting markers):
            {
                "title": "string",
                "description": "string",
                "prerequisites": ["string", ...],
                "steps": [
                    {
                        "action": "string"
                    },
                    ...
                ]
            }
        `;

        // Generate MOP details using GPT
        let gptResponse = await this.gpt.generateResponse(detailedPrompt);
        console.log(gptResponse);
        if (!gptResponse) {
            throw new Error("Failed to generate MOP details.");
        }

        // Remove ```json prefix and suffix if present
        gptResponse = gptResponse.replace(/^```json\s*/, "").replace(/```$/, "");

        const mopData = JSON.parse(gptResponse);

        // Save MOP to the database
        const createdMOP = await this.db.createMOP({
            title: mopData.title,
            description: mopData.description,
            prerequisites: mopData.prerequisites,
            steps: mopData.steps.map((step: any, index: number) => ({
                stepNumber: index + 1,
                action: step.action,
            })),
        });

        return { data: createdMOP };
    }
}
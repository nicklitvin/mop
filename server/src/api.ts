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
            - A detailed description of the procedure.
            - A list of prerequisites required to perform the procedure.
            - A series of steps, where each step includes:
              - The action to be performed.

            Format the response as a JSON object with the following structure:
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
        const gptResponse = await this.gpt.generateResponse(detailedPrompt);
        if (!gptResponse) {
            throw new Error("Failed to generate MOP details.");
        }

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
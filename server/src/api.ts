import { APIOutput, MOPInput } from "./types";
import { DB } from "./db";
import { MOP, Step } from "@prisma/client";
import { GPT } from "./gpt";
import { updatePrerequisites, validateSteps } from "./utils";

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

    async createMOP(input: MOPInput): Promise<APIOutput<MOP>> {
        const { prompt, difficultyLevel, riskAssessment, context } = input;

        // Step 1: Generate general MOP info and sections
        const generalPrompt = `
            You are tasked with creating a Methods of Procedure (MOP) for a data center operation based on the following subject: "${prompt}".
            Additional context:
            - Difficulty Level: "${difficultyLevel}"
            - Risk Assessment: "${riskAssessment}"
            - Context: "${context}"
            The MOP should include:
            - A title summarizing the procedure.
            - A concise, technical description of the procedure.
            - A list of prerequisites required to perform the procedure.
            - General sections (not detailed steps) that outline the main parts of the procedure.

            Return the response as a JSON object in the exact format below, with no additional text or markers:
            {
                "title": "string",
                "description": "string",
                "prerequisites": ["string", ...],
                "sections": ["string", ...]
            }
        `;
        const generalResponse = await this.gpt.generateResponse(generalPrompt);
        if (!generalResponse) {
            throw new Error("Failed to generate general MOP info.");
        }
        const generalData = JSON.parse(generalResponse);

        // Step 2: Generate detailed steps for each section
        const detailedSteps: Array<{ action: string }> = [];
        for (const section of generalData.sections) {
            const sectionPrompt = `
                You are creating detailed steps for a Methods of Procedure (MOP) for data center operations.
                The MOP is titled "${generalData.title}" and is described as follows: "${generalData.description}".
                Based on the section "${section}" of the MOP, generate a detailed list of steps.
                Each step should include:
                - A single, specific, and atomic action that can be easily verified.
                - If a specific tool or equipment is needed, explicitly mention it and prefix it with one of the following words: "use", "require", or "need".

                Return the response as a JSON array in the exact format below, with no additional text or markers:
                [
                    { "action": "string" },
                    ...
                ]
            `;
            const sectionResponse = await this.gpt.generateResponse(sectionPrompt);
            if (!sectionResponse) {
                throw new Error(`Failed to generate steps for section: ${section}`);
            }
            const steps = JSON.parse(sectionResponse);
            detailedSteps.push(...steps);
        }

        // Step 3: Validate steps
        const validatedSteps = await validateSteps(detailedSteps, this.gpt);

        // Step 4: Update prerequisites
        const updatedPrerequisites = updatePrerequisites(validatedSteps, generalData.prerequisites);

        // Step 5: Save MOP to the database
        const createdMOP = await this.db.createMOP({
            title: generalData.title,
            description: generalData.description,
            prerequisites: updatedPrerequisites,
            steps: validatedSteps.map((step, index) => ({
                stepNumber: index + 1,
                action: step.action,
            })),
        });

        return { data: createdMOP };
    }

    async getMOP(id: number): Promise<APIOutput<MOP>> {
        const mop = await this.db.getMOP(id);
        if (!mop) {
            return { message: "MOP not found" };
        }
        return { data: mop };
    }
}
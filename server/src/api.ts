import { APIOutput, MOPInput } from "./types";
import { DB } from "./db";
import { MOP, Step, PromptType } from "@prisma/client";
import { GPT } from "./gpt";
import { updatePrerequisites, validateSteps, generateGeneralMOPInfo, generateDetailedSteps, deducePromptType } from "./utils";

export class API {
    private db: DB;
    private gpt: GPT;

    constructor() {
        this.db = new DB();
        this.gpt = new GPT();
    }

    async hi(): Promise<APIOutput<string>> {
        return Promise.resolve({
            data: "hi"
        });
    }

    async createMOP(input: MOPInput): Promise<APIOutput<MOP>> {
        const { prompt, difficultyLevel, riskAssessment, context } = input;

        // Step 1: Generate general MOP info and sections
        const generalData = await generateGeneralMOPInfo(this.gpt, this.db, {
            prompt,
            difficultyLevel,
            riskAssessment,
            context,
        });

        // Step 2: Generate detailed steps for each section
        const detailedSteps = await generateDetailedSteps(this.gpt, this.db, generalData);

        // Step 3: Validate steps
        const validatedSteps = await validateSteps(detailedSteps, this.gpt, this.db);

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

    async getLastMOP(): Promise<APIOutput<MOP>> {
        const lastMOP = await this.db.getLastMOP();
        if (!lastMOP) {
            return { message: "No MOPs found" };
        }
        return { data: lastMOP };
    }

    async updatePrompt(input: { comment: string }): Promise<APIOutput<{ type: PromptType; content: string }>> {
        const { comment } = input;

        // Step 1: Deduce the prompt type using the utility function
        const type = await deducePromptType(this.gpt, comment);
        if (!type) {
            return { message: "Failed to deduce prompt type" };
        }

        // Step 2: Retrieve the existing prompt from the database
        const existingPrompt = await this.db.getPromptByType(type);
        if (!existingPrompt) {
            return { message: "Prompt not found" };
        }

        // Step 3: Generate a new prompt based on the user's comment
        const feedbackPrompt = `
            You are tasked with improving the following prompt based on user feedback.
            Original prompt:
            "${existingPrompt.content}"

            User feedback:
            "${comment}"

            Return the updated prompt as plain text with no additional text or markers.
        `;
        const newPromptContent = await this.gpt.generateResponse(feedbackPrompt);
        if (!newPromptContent) {
            throw new Error("Failed to generate updated prompt using GPT.");
        }

        // Step 4: Update the prompt in the database
        const updatedPrompt = await this.db.updatePrompt(type, newPromptContent);

        return { data: { type, content: updatedPrompt.content } };
    }
}
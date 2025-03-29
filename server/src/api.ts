import { APIOutput, MOPInput } from "./types";
import { DB } from "./db";
import { MOP, Step } from "@prisma/client";
import { GPT } from "./gpt";
import { updatePrerequisites, validateSteps, generateGeneralMOPInfo, generateDetailedSteps } from "./utils";

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
        const generalData = await generateGeneralMOPInfo(this.gpt, {
            prompt,
            difficultyLevel,
            riskAssessment,
            context,
        });

        // Step 2: Generate detailed steps for each section
        const detailedSteps = await generateDetailedSteps(this.gpt, generalData);

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
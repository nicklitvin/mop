import { APIOutput, MOPInput, PromptType, OutputMOP, ChangeType } from "./types";
import { DB } from "./db";
import { MOP } from "@prisma/client";
import { GPT } from "./gpt";
import { updatePrerequisites, validateSteps, generateGeneralMOPInfo, generateDetailedSteps, deducePromptType, generateUpdatedPrompt, generateMOPChanges } from "./utils";

export class API {
    public db: DB;
    public gpt: GPT;

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

    async getMOP(id: number): Promise<APIOutput<OutputMOP>> {
        const mop = await this.db.getMOP(id);
        if (!mop) {
            return { message: "MOP not found" };
        }
        return { 
            data: mop
        };
    }

    async getLastMOP(): Promise<APIOutput<OutputMOP>> {
        const lastMOP = await this.db.getLastMOP();
        if (!lastMOP) {
            return { message: "No MOPs found" };
        }
        return { 
            data: lastMOP
        };
    }

    async getMOPVersion(input: { id: number; version: number }): Promise<APIOutput<OutputMOP>> {
        const { id, version } = input;

        const mop = await this.db.getMOPVersion(id, version);
        if (!mop) {
            return { message: "MOP not found or version not available" };
        }

        return { data: mop };
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
        const newPromptContent = await generateUpdatedPrompt(this.gpt, existingPrompt.content, comment);
        if (!newPromptContent) {
            throw new Error("Failed to generate updated prompt using GPT.");
        }

        // Step 4: Update the prompt in the database
        const updatedPrompt = await this.db.updatePrompt(type, newPromptContent);

        return { data: { type, content: updatedPrompt.content } };
    }

    async updateMOP(input: { id: number; prompt: string }): Promise<APIOutput<OutputMOP>> {
        const { id, prompt } = input;

        // Step 1: Retrieve the existing MOP from the database
        const existingMOP = await this.db.getMOP(id);
        if (!existingMOP) {
            return { message: "MOP not found" };
        }

        // Step 2: Generate updates using the utility function
        const updates = await generateMOPChanges(this.gpt, existingMOP, prompt);
        // const updates = [
        //     {
        //         field: 'prerequisites' as ChangeType,
        //         oldValue: 'NEW NETWORK SWITCHES,SCREWDRIVER,NETWORK CABLES,PATCH PANELS,CABLE TIES,LABELING TOOLS,BACKUP CONFIGURATION SOFTWARE,ACCESS TO MANAGEMENT INTERFACES',
        //         newValue: 'TEST'
        //     },
        //     {
        //         field: "steps" as ChangeType,
        //         oldValue: "OLD VALUE",
        //         newValue: "NEW VALUE",
        //         stepNumber: 1 // Specify the step number for the update
        //     }
        // ]
        if (!updates || updates.length === 0) {
            return { message: "No updates generated for the MOP" };
        }

        // Step 3: Save the changes to the database
        await this.db.updateMOP(id, updates)

        // Step 4: Fetch the updated MOP
        const updatedMOP = await this.db.getMOP(id);
        if (!updatedMOP) {
            return { message: "Failed to fetch updated MOP" };
        }

        return { data: updatedMOP };
    }

    async getMOPChanges(id: number): Promise<APIOutput<{ version: number; field: string; oldValue: string; newValue: string; stepNumber?: number }[]>> {
        const changes = await this.db.getMOPChanges(id);
        if (!changes || changes.length === 0) {
            return { data: [] };
        }

        // Map database result to expected output format
        const formattedChanges = changes.map(change => ({
            version: change.targetVersion, // Map targetVersion to version
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            stepNumber: change.stepNumber,
        }));

        return { data: formattedChanges };
    }
}
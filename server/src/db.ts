import { PrismaClient } from "@prisma/client";
import { PromptType } from "./types"; // Updated import to use the TypeScript type

export class DB {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async createMOP(data: {
        title: string;
        description: string;
        prerequisites: string[];
        steps: { stepNumber: number; action: string }[];
    }) {
        return await this.prisma.mOP.create({
            data: {
                title: data.title,
                description: data.description,
                prerequisites: data.prerequisites.map(item => item.replace(/[\[\]]/g, "")).join("|"), // Remove square brackets and join
                steps: {
                    create: data.steps.map((step) => ({
                        stepNumber: step.stepNumber,
                        action: step.action.replace(/[\[\]]/g, ""), // Remove square brackets
                    })),
                },
            },
            include: {
                steps: true,
            },
        });
    }

    async getMOP(id: number) {
        const mop = await this.prisma.mOP.findUnique({
            where: { id },
            include: { steps: true },
        });
        if (mop) {
            return {
                ...mop,
                prerequisites: mop.prerequisites.split("|"), // Convert '|' separated string back to array
            };
        }
        return null;
    }

    async getLastMOP() {
        const mop = await this.prisma.mOP.findFirst({
            orderBy: { id: "desc" }, // Fetch the MOP with the largest ID
            include: { steps: true },
        });
        if (mop) {
            return {
                ...mop,
                prerequisites: mop.prerequisites.split("|"), // Convert '|' separated string back to array
            };
        }
        return null;
    }

    async savePrompt(type: PromptType, content: string) {
        return await this.prisma.prompt.upsert({
            where: { type },
            update: { content },
            create: { type, content },
        });
    }

    async getPromptByType(type: PromptType) {
        return await this.prisma.prompt.findUnique({
            where: { type },
        });
    }
    
    async getAllPrompts() {
        return await this.prisma.prompt.findMany();
    }

    async updatePrompt(type: PromptType, newContent: string) {
        return await this.prisma.prompt.update({
            where: { type },
            data: { content: newContent },
        });
    }

    async saveChange(mopId: number, field: string, oldValue: string, newValue: string) {
        return await this.prisma.change.create({
            data: {
                mopId,
                field,
                oldValue,
                newValue,
            },
        });
    }

    async updateMOP(id: number, updates: { field: string; oldValue: string; newValue: string; stepNumber?: number }[]) {
        const mop = await this.getMOP(id);
        if (!mop) {
            throw new Error("MOP not found");
        }

        for (const update of updates) {
            const { field, oldValue, newValue, stepNumber } = update;

            if (stepNumber !== undefined) {
                // Handle step-specific updates
                const step = mop.steps.find((s) => s.stepNumber === stepNumber);
                if (!step) {
                    throw new Error(`Step ${stepNumber} not found in MOP ${id}`);
                }

                // Save the change
                await this.saveChange(id, `step:${stepNumber}:${field}`, oldValue, newValue);

                // Update the step
                await this.prisma.step.updateMany({
                    where: { mopId: id, stepNumber },
                    data: { [field]: newValue }, // Use dynamic key assignment
                });
            } else {
                // Handle MOP-level updates
                await this.saveChange(id, field, oldValue, newValue);

                // Update the MOP
                await this.prisma.mOP.update({
                    where: { id },
                    data: { [field]: newValue }, // Use dynamic key assignment
                });
            }
        }
    }

    async getMOPVersion(id: number, targetVersion: number) {
        const mop = await this.getMOP(id);
        if (!mop) {
            throw new Error("MOP not found");
        }

        if (mop.version <= targetVersion) {
            return mop; // Already at or below the target version
        }

        // Fetch all changes for the MOP, ordered by most recent first
        const changes = await this.prisma.change.findMany({
            where: { mopId: id },
            orderBy: { dateChanged: "desc" },
        });

        // Apply changes in reverse order until the target version is reached
        let currentVersion = mop.version;
        const downgradedMOP = {
            ...mop,
            steps: mop.steps.map((step) => ({ ...step })), // Deep copy steps to avoid mutating the original
        };

        for (const change of changes) {
            if (currentVersion <= targetVersion) {
                break;
            }

            if (change.field.startsWith("step:")) {
                // Handle step-specific changes
                const [, stepNumber, field] = change.field.split(":");
                const step = downgradedMOP.steps.find((s) => s.stepNumber === parseInt(stepNumber, 10));
                if (step) {
                    (step as any)[field] = change.oldValue; // Use type assertion for dynamic key assignment
                }
            } else {
                // Handle MOP-level changes
                (downgradedMOP as any)[change.field] = change.oldValue; // Use type assertion for dynamic key assignment
            }

            currentVersion--; // Decrement the version after applying a change
        }

        return downgradedMOP;
    }
}
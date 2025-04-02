import { PrismaClient } from "@prisma/client";
import { PromptType, ChangeType } from "./types"; // Updated import to use the TypeScript types

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

    async saveChange(
        mopId: number,
        field: ChangeType,
        oldValue: string,
        newValue: string,
        targetVersion: number,
        stepNumber?: number // Added stepNumber
    ) {
        return await this.prisma.change.create({
            data: {
                mopId,
                field,
                oldValue,
                newValue,
                targetVersion,
                stepNumber, // Save stepNumber if provided
            },
        });
    }

    async updateMOP(
        id: number,
        updates: { field: ChangeType; oldValue: string; newValue: string; stepNumber?: number }[]
    ) {
        const mop = await this.getMOP(id);
        if (!mop) {
            throw new Error("MOP not found");
        }

        const newVersion = mop.version + 1; // Increment version for the update

        for (const update of updates) {
            const { field, oldValue, newValue, stepNumber } = update;

            if (stepNumber !== undefined) {
                // Handle step-specific updates
                const step = mop.steps.find((s) => s.stepNumber === stepNumber);
                if (!step) {
                    throw new Error(`Step ${stepNumber} not found in MOP ${id}`);
                }

                // Save the change
                await this.saveChange(id, "steps", oldValue, newValue, newVersion, stepNumber); // Pass stepNumber

                // Update the step
                await this.prisma.step.updateMany({
                    where: { mopId: id, stepNumber },
                    data: { action: newValue }, // Use dynamic key assignment
                });
            } else {
                // Handle MOP-level updates
                await this.saveChange(id, field, oldValue, newValue, newVersion); // No stepNumber

                // Update the MOP
                await this.prisma.mOP.update({
                    where: { id },
                    data: { [field]: newValue }, // Use dynamic key assignment
                });
            }
        }

        // Update the MOP version
        await this.prisma.mOP.update({
            where: { id },
            data: { version: newVersion },
        });
    }

    async getMOPVersion(id: number, targetVersion: number) {
        const mop = await this.getMOP(id);
        if (!mop) {
            throw new Error("MOP not found");
        }

        if (mop.version < targetVersion) {
            return null; // Target version does not exist
        }

        if (mop.version === targetVersion) {
            return { ...mop, version: targetVersion }; // Return the requested version
        }

        // Fetch all changes for the MOP, ordered by most recent first
        const changes = await this.prisma.change.findMany({
            where: { mopId: id },
            orderBy: { dateChanged: "desc" },
        });

        // Apply changes in reverse order until the target version is reached
        const downgradedMOP = {
            ...mop,
            steps: mop.steps.map((step) => ({ ...step })), // Deep copy steps to avoid mutating the original
        };

        for (const change of changes) {
            if (change.targetVersion <= targetVersion) {
                break; // Stop applying changes when targetVersion matches
            }

            if (change.field === "prerequisites") {
                // Handle prerequisites changes
                downgradedMOP.prerequisites = change.oldValue.split("|"); // Convert oldValue to string[]
            } else if (change.stepNumber !== null && change.stepNumber !== undefined) {
                // Handle step-specific changes
                const step = downgradedMOP.steps.find((s) => s.stepNumber === change.stepNumber);
                if (step) {
                    step.action = change.oldValue;
                }
            } else {
                // Handle MOP-level changes
                (downgradedMOP as any)[change.field] = change.oldValue; // Use type assertion for dynamic key assignment
            }
        }

        return { ...downgradedMOP, version: targetVersion }; // Ensure the returned MOP reflects the requested version
    }

    async getMOPChanges(mopId: number) {
        return await this.prisma.change.findMany({
            where: { mopId },
            orderBy: { targetVersion: "asc" }, // Order changes by version
        });
    }

    async resetDatabase() {
        await this.prisma.change.deleteMany({});
        await this.prisma.step.deleteMany({});
        await this.prisma.mOP.deleteMany({});
        await this.prisma.prompt.deleteMany({});
    }
}
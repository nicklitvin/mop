import { PrismaClient } from "@prisma/client"

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
                prerequisites: data.prerequisites.map(prerequisite =>
                    prerequisite.replace(/[\[\]]/g, "") // Remove square brackets
                ),
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

    async getMOP(id: number) { // Change id to number
        return await this.prisma.mOP.findUnique({
            where: { id },
            include: { steps: true },
        });
    }
}
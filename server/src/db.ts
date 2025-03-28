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
                prerequisites: data.prerequisites,
                steps: {
                    create: data.steps.map((step) => ({
                        stepNumber: step.stepNumber,
                        action: step.action,
                    })),
                },
            },
            include: {
                steps: true,
            },
        });
    }
}
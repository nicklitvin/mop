import { MOP } from "@prisma/client";

export interface APIOutput<T> {
    data?: T
    message?: string
}

export interface MOPInput {
    prompt: string;
    difficultyLevel?: string;
    riskAssessment?: string;
    context?: string;
}

// Added PromptType as a TypeScript type
export type PromptType = "validation" | "generalInfo" | "detailedSteps";

export interface OutputMOP extends Omit<MOP, "prerequisites"> {
    prerequisites: string[];
}
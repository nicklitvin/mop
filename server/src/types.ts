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
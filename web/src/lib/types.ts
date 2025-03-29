export interface APIOutput<T> {
    data?: T
    message?: string
}

export interface MOP {
    id: number;
    title: string;
    description: string;
    prerequisites: string[];
    dateCreated: Date;
    version: number;
    steps: Step[];
}

export interface Step {
    id: number;
    stepNumber: number;
    mopId: number;
    action: string;
}
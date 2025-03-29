import { GPT } from "./gpt";

export function updatePrerequisites(
    steps: Array<{ action: string }>,
    prerequisites: string[]
): string[] {
    // Define specific words to look for when identifying tools or equipment
    const toolKeywords = ["use", "require", "need"];

    // Check if tools or equipment mentioned in steps are missing from prerequisites
    const requiredTools = steps
        .flatMap(step => 
            step.action.match(new RegExp(`(?:${toolKeywords.join("|")}) (\\w+)`, "gi")) || []
        )
        .map(match => match.replace(new RegExp(`(?:${toolKeywords.join("|")}) `, "i"), "").trim());

    const updatedPrerequisites = new Set(prerequisites);
    requiredTools.forEach(tool => {
        if (!updatedPrerequisites.has(tool)) {
            updatedPrerequisites.add(tool);
        }
    });

    return Array.from(updatedPrerequisites);
}

export async function validateSteps(
    steps: Array<{ action: string }>,
    gpt: GPT
): Promise<Array<{ action: string }>> {
    const validationPrompt = `
        You are validating a list of steps for a Methods of Procedure (MOP) in data center operations.
        The steps are as follows:
        ${steps.map((step, index) => `${index + 1}. ${step.action}`).join("\n")}

        Validate the following:
        - Ensure the steps are in a logical order.
        - Identify and remove any duplicate, unnecessary, or missing steps.
        - Adjust the steps to make them clear and concise.

        Return the validated steps as a JSON array in the exact format below, with no additional text or markers:
        [
            { "action": "string" },
            ...
        ]
    `;
    const response = await gpt.generateResponse(validationPrompt);
    if (!response) {
        throw new Error("Failed to validate steps using GPT.");
    }
    return JSON.parse(response);
}

export async function generateGeneralMOPInfo(
    gpt: GPT,
    input: { prompt: string; difficultyLevel?: string; riskAssessment?: string; context?: string }
): Promise<{ title: string; description: string; prerequisites: string[]; sections: string[] }> {
    const { prompt, difficultyLevel, riskAssessment, context } = input;
    const generalPrompt = `
        You are tasked with creating a Methods of Procedure (MOP) for a data center operation based on the following subject: "${prompt}".
        Additional context:
        ${difficultyLevel ? `- Difficulty Level: "${difficultyLevel}"` : ""}
        ${riskAssessment ? `- Risk Assessment: "${riskAssessment}"` : ""}
        ${context ? `- Context: "${context}"` : ""}
        The MOP should include:
        - A title summarizing the procedure.
        - A concise, technical description of the procedure.
        - A list of prerequisites required to perform the procedure.
        - General sections (not detailed steps) that outline the main parts of the procedure.

        Return the response as a JSON object in the exact format below, with no additional text or markers:
        {
            "title": "string",
            "description": "string",
            "prerequisites": ["string", ...],
            "sections": ["string", ...]
        }
    `;
    const generalResponse = await gpt.generateResponse(generalPrompt);
    if (!generalResponse) {
        throw new Error("Failed to generate general MOP info.");
    }
    return JSON.parse(generalResponse);
}

export async function generateDetailedSteps(
    gpt: GPT,
    generalData: { title: string; description: string; sections: string[] }
): Promise<Array<{ action: string }>> {
    const detailedSteps: Array<{ action: string }> = [];
    for (const section of generalData.sections) {
        const sectionPrompt = `
            You are creating detailed steps for a Methods of Procedure (MOP) for data center operations.
            The MOP is titled "${generalData.title}" and is described as follows: "${generalData.description}".
            Based on the section "${section}" of the MOP, generate a detailed list of steps.
            Each step should include:
            - A single, specific, and atomic action that can be easily verified.
            - If a specific tool or equipment is needed, explicitly mention it and prefix it with one of the following words: "use", "require", or "need".

            Return the response as a JSON array in the exact format below, with no additional text or markers:
            [
                { "action": "string" },
                ...
            ]
        `;
        const sectionResponse = await gpt.generateResponse(sectionPrompt);
        if (!sectionResponse) {
            throw new Error(`Failed to generate steps for section: ${section}`);
        }
        const steps = JSON.parse(sectionResponse);
        detailedSteps.push(...steps);
    }
    return detailedSteps;
}
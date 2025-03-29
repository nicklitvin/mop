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
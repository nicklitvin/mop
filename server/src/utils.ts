import { GPT } from "./gpt";
import { DB } from "./db";
import { PromptType } from "./types"; // Updated import to use the TypeScript type

export function updatePrerequisites(
    steps: Array<{ action: string }>,
    prerequisites: string[]
): string[] {
    // Identify tools wrapped in square brackets
    const requiredTools = steps
        .flatMap(step => 
            step.action.match(/\[(\w+)\]/g) || []
        )
        .map(match => match.replace(/[\[\]]/g, "").trim()); // Remove square brackets

    const updatedPrerequisites = new Set(
        prerequisites.map(item => item.replace(/[\[\]]/g, "")) // Remove square brackets from existing prerequisites
    );
    requiredTools.forEach(tool => {
        if (!updatedPrerequisites.has(tool)) {
            updatedPrerequisites.add(tool);
        }
    });

    return Array.from(updatedPrerequisites); // Return tools without square brackets
}

export async function validateSteps(
    steps: Array<{ action: string }>,
    gpt: GPT,
    db: DB
): Promise<Array<{ action: string }>> {
    const validationPrompt = `
        You are validating a list of steps for a Methods of Procedure (MOP) in data center operations.
        The steps are as follows:
        ${steps.map((step, index) => `${index + 1}. ${step.action}`).join("\n")}

        Validate the following:
        - Ensure each step is specific to a single action or physical item.
        - Ensure the steps are in a logical order.
        - Identify and remove any duplicate, unnecessary, or missing steps.
        - Adjust the steps to make them clear, concise, and specific. For example:
            - "Reconnect switches" -> "Plug cable X into port Y on switch Z."
            - "Use console" -> "Run commands X, Y, Z in the terminal."
        - Ensure the steps adhere to security and industry standards, such as:
            - Compliance with ISO 27001 for information security.
            - Adherence to NIST guidelines for secure operations.
            - Avoidance of actions that could compromise system integrity or data privacy.
        - For data center operations specifically:
            - Ensure physical safety measures are included, such as proper handling of hardware or cables.
            - Verify that steps involving power systems (e.g., UPS, PDUs) include precautions to avoid outages or equipment damage.
            - Confirm that network-related steps (e.g., switch configurations, cable connections) follow best practices for redundancy and failover.
            - Ensure environmental controls (e.g., cooling systems) are not disrupted during the procedure.

        Return the validated steps as a JSON array in the exact format below, with no additional text or markers:
        [
            { "action": "string" },
            ...
        ]
    `;
    const savedPrompt = await db.savePrompt("validation", validationPrompt); // Assume savePrompt is always defined
    const response = await gpt.generateResponse(savedPrompt.content);
    if (!response) {
        throw new Error("Failed to validate steps using GPT.");
    }
    return JSON.parse(response);
}

export async function generateGeneralMOPInfo(
    gpt: GPT,
    db: DB,
    input: { prompt: string; difficultyLevel?: string; riskAssessment?: string; context?: string }
): Promise<{ title: string; description: string; prerequisites: string[]; sections: string[] }> {
    const { prompt, difficultyLevel, riskAssessment, context } = input;
    const generalPrompt = `
        Create a Methods of Procedure (MOP) for data center operations on: "${prompt}".
        Context:
        ${difficultyLevel ? `- Difficulty: "${difficultyLevel}"` : ""}
        ${riskAssessment ? `- Risk: "${riskAssessment}"` : ""}
        ${context ? `- Additional Context: "${context}"` : ""}
        Include:
        - A title summarizing the procedure.
        - A concise, technical description.
        - A list of specific prerequisites such as tools or equipment (e.g., "screwdriver", "network cable").
        - Up to 8 general sections outlining the main parts of the procedure.

        Return as JSON:
        {
            "title": "string",
            "description": "string",
            "prerequisites": ["string", ...],
            "sections": ["string", ...]
        }
    `;
    const savedPrompt = await db.savePrompt("generalInfo", generalPrompt); // Assume savePrompt is always defined
    const generalResponse = await gpt.generateResponse(savedPrompt.content);
    if (!generalResponse) {
        throw new Error("Failed to generate general MOP info.");
    }
    return JSON.parse(generalResponse);
}

export async function generateDetailedSteps(
    gpt: GPT,
    db: DB,
    generalData: { title: string; description: string; sections: string[] }
): Promise<Array<{ action: string }>> {
    const detailedSteps: Array<{ action: string }> = [];
    for (const section of generalData.sections) {
        const sectionPrompt = `
            Create detailed steps for the MOP titled "${generalData.title}" described as: "${generalData.description}".
            Section: "${section}".
            Each step must:
            - Be specific to the actual task (e.g., "Plug cable X into port Y on switch Z").
            - Avoid vague instructions.
            - Mention tools or equipment in square brackets (e.g., "[screwdriver]", "[network cable]"), but ignore generic items like "pen" or "paper".
            - Ensure compliance with security and industry standards.

            Return as JSON:
            [
                { "action": "string" },
                ...
            ]
        `;
        const savedPrompt = await db.savePrompt("detailedSteps", sectionPrompt); // Assume savePrompt is always defined
        const sectionResponse = await gpt.generateResponse(savedPrompt.content);
        if (!sectionResponse) {
            throw new Error(`Failed to generate steps for section: ${section}`);
        }
        const steps = JSON.parse(sectionResponse);
        detailedSteps.push(...steps);
    }
    return detailedSteps;
}

export async function deducePromptType(gpt: GPT, comment: string): Promise<PromptType | null> {
    // Hardcoded valid types for PromptType
    const validTypes : PromptType[] = ["validation", "generalInfo", "detailedSteps"];

    const deduceTypePrompt = `
        You are tasked with identifying the type of a prompt based on its content.
        The content is as follows:
        "${comment}"

        The valid types of prompts are: ${validTypes.join(", ")}.
        Return the type of the prompt as plain text with no additional text or markers.
    `;
    const response = await gpt.generateResponse(deduceTypePrompt);
    if (!response) {
        throw new Error("Failed to deduce prompt type using GPT.");
    }
    return response.trim() as PromptType;
}

export async function generateUpdatedPrompt(
    gpt: GPT,
    existingPromptContent: string,
    comment: string
): Promise<string> {
    const feedbackPrompt = `
        You are tasked with improving the following prompt based on user feedback.
        Original prompt:
        "${existingPromptContent}"

        User feedback:
        "${comment}"

        Return the updated prompt as plain text with no additional text or markers.
    `;
    return await gpt.generateResponse(feedbackPrompt);
}

export async function generateMOPChanges(
    gpt: GPT,
    existingMOP: any,
    userPrompt: string
): Promise<{ field: string; oldValue: string; newValue: string; stepNumber?: number }[]> {
    const changesPrompt = `
        You are tasked with updating a Methods of Procedure (MOP) based on the user's input.
        The current MOP is as follows:
        Title: "${existingMOP.title}"
        Description: "${existingMOP.description}"
        Prerequisites: ${JSON.stringify(existingMOP.prerequisites)}
        Steps:
        ${existingMOP.steps.map((step: any) => `${step.stepNumber}. ${step.action}`).join("\n")}

        User's input:
        "${userPrompt}"

        Based on the user's input, determine the necessary changes to the MOP. 
        For each change, specify:
        - The field being updated (e.g., "title", "description", "prerequisites", or "steps").
        - The old value of the field.
        - The new value for the field.
        - If the change is for a specific step, include the step number.

        Return the changes as a JSON array in the following format:
        [
            { "field": "string", "oldValue": "string", "newValue": "string", "stepNumber": number (optional) },
            ...
        ]
    `;
    const response = await gpt.generateResponse(changesPrompt);
    if (!response) {
        throw new Error("Failed to generate MOP changes using GPT.");
    }
    return JSON.parse(response);
}
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
    const savedPrompt = db.savePrompt
        ? await db.savePrompt("validation", validationPrompt) // Use db.savePrompt if it exists
        : { content: validationPrompt }; // Fallback if savePrompt is not defined
    const response = await gpt.generateResponse(savedPrompt.content); // Use the saved prompt content
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
        You are tasked with creating a Methods of Procedure (MOP) for a data center operation based on the following subject: "${prompt}".
        Additional context:
        ${difficultyLevel ? `- Difficulty Level: "${difficultyLevel}"` : ""}
        ${riskAssessment ? `- Risk Assessment: "${riskAssessment}"` : ""}
        ${context ? `- Context: "${context}"` : ""}
        The MOP should include:
        - A title summarizing the procedure.
        - A concise, technical description of the procedure.
        - A list of prerequisites required to perform the procedure. Each prerequisite should be specific to a single physical item or tool, e.g., "[screwdriver]", "[network cable]".
        - General sections (not detailed steps) that outline the main parts of the procedure.

        Return the response as a JSON object in the exact format below, with no additional text or markers:
        {
            "title": "string",
            "description": "string",
            "prerequisites": ["string", ...],
            "sections": ["string", ...]
        }
    `;
    const savedPrompt = { content: generalPrompt }; // Replace db.savePrompt with a direct object
    const generalResponse = await gpt.generateResponse(savedPrompt.content); // Use the saved prompt content
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
            You are creating detailed steps for a Methods of Procedure (MOP) for data center operations.
            The MOP is titled "${generalData.title}" and is described as follows: "${generalData.description}".
            Based on the section "${section}" of the MOP, generate a detailed list of steps.
            Each step should:
            - Be specific to a single action or physical item.
            - Include clear instructions, e.g., "Plug cable X into port Y on switch Z" or "Run commands X, Y, Z in the terminal."
            - Assume the user has the correct permissions and knowledge, so there is no need to check for approvals or prerequisites.
            - Ensure compliance with security and industry standards, such as:
                - ISO 27001 for information security.
                - NIST guidelines for secure operations.
                - Avoidance of actions that could compromise system integrity or data privacy.
            - For data center operations specifically:
                - Include physical safety measures, such as proper handling of hardware or cables.
                - Ensure steps involving power systems (e.g., UPS, PDUs) include precautions to avoid outages or equipment damage.
                - Verify that network-related steps (e.g., switch configurations, cable connections) follow best practices for redundancy and failover.
                - Ensure environmental controls (e.g., cooling systems) are not disrupted during the procedure.

            Return the response as a JSON array in the exact format below, with no additional text or markers:
            [
                { "action": "string" },
                ...
            ]
        `;
        const savedPrompt = db.savePrompt
            ? await db.savePrompt("detailedSteps", sectionPrompt) // Use db.savePrompt if it exists
            : { content: sectionPrompt }; // Fallback if savePrompt is not defined
        const sectionResponse = await gpt.generateResponse(savedPrompt.content); // Use the saved prompt content
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
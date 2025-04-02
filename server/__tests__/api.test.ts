import { describe, it, expect, vi, beforeEach } from "vitest";
import { API } from "../src/api";
import { GPT } from "../src/gpt";
import { DB } from "../src/db";
import { MOP } from "@prisma/client";

vi.mock("../src/gpt", () => {
    return {
        GPT: vi.fn().mockImplementation(() => ({
            generateResponse: vi.fn().mockResolvedValue(null) // Default mock to prevent actual requests
        }))
    };
});

vi.mock("../src/db", () => {
    return {
        DB: vi.fn().mockImplementation(() => ({
            createMOP: vi.fn(),
            getMOP: vi.fn(),
            getPromptByType: vi.fn(),
            updatePrompt: vi.fn(),
            savePrompt: vi.fn().mockResolvedValue({ content: "mocked prompt content" }), // Ensure savePrompt returns valid content
            updateMOP: vi.fn(),
            getMOPVersion: vi.fn(),
        }))
    };
});

describe("API Class", () => {
    let api: API;

    beforeEach(() => {
        api = new API();
        api.db = new DB(); // Use the mocked DB instance
        api.gpt = new GPT(); // Use the mocked GPT instance
    });

    it("should update a prompt in the database", async () => {
        // Define input and expected values
        const comment = "Make the prompt more concise.";
        const promptType = "generalInfo";

        const existingPrompt = {
            type: promptType,
            content: "Original prompt content.",
            id: 1,
            dateCreated: new Date(),
        };

        const updatedPromptContent = "Updated prompt content.";

        // Mock GPT and DB responses
        vi.mocked(api.gpt.generateResponse).mockResolvedValueOnce(promptType); // Deduce prompt type
        vi.mocked(api.db.getPromptByType).mockResolvedValueOnce(existingPrompt); // Retrieve existing prompt
        vi.mocked(api.gpt.generateResponse).mockResolvedValueOnce(updatedPromptContent); // Generate updated prompt
        vi.mocked(api.db.updatePrompt).mockResolvedValueOnce({
            type: promptType,
            content: updatedPromptContent,
            id: existingPrompt.id,
            dateCreated: existingPrompt.dateCreated,
        }); // Update prompt in DB

        // Call updatePrompt
        const result = await api.updatePrompt({ comment });

        // Assertions
        expect(api.db.getPromptByType).toHaveBeenCalledWith(promptType);
        expect(api.gpt.generateResponse).toHaveBeenCalledWith(expect.stringContaining(comment));
        expect(api.db.updatePrompt).toHaveBeenCalledWith(promptType, updatedPromptContent);
        expect(result.data).toEqual({
            type: promptType,
            content: updatedPromptContent,
        });
    });
});

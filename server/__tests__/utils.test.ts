import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePrerequisites, validateSteps, generateGeneralMOPInfo, generateDetailedSteps } from "../src/utils";
import { GPT } from "../src/gpt";
import { DB } from "../src/db";

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
            savePrompt: vi.fn().mockResolvedValue({ content: "mocked prompt content" }) // Ensure savePrompt returns valid content
        }))
    };
});

describe("utils", () => {
    let gpt: GPT;
    let db: DB;

    beforeEach(() => {
        gpt = new GPT(); // Use the mocked GPT instance
        db = new DB(); // Use the mocked DB instance
    });

    describe("updatePrerequisites", () => {
        it("should add missing tools to prerequisites", () => {
            const steps = [
                { action: "Step 1: Prepare the workspace with [hammer]" },
                { action: "Step 2: Tighten screws using [screwdriver]" }
            ];
            const prerequisites = ["wrench"];
            const result = updatePrerequisites(steps, prerequisites);
            expect(result).toEqual(["wrench", "hammer", "screwdriver"]);
        });

        it("should not duplicate existing prerequisites", () => {
            const steps = [{ action: "Step 1: Check the bolts with [wrench]" }];
            const prerequisites = ["wrench"];
            const result = updatePrerequisites(steps, prerequisites);
            expect(result).toEqual(["wrench"]);
        });
    });

    describe("validateSteps", () => {
        it("should validate and return updated steps", async () => {
            const steps = [
                { action: "Step 1: Do something" },
                { action: "Step 2: Do something else" }
            ];
            vi.spyOn(gpt, "generateResponse").mockResolvedValueOnce(
                JSON.stringify(steps)
            );
            const result = await validateSteps(steps, gpt, db); // Pass db as an argument
            expect(result).toEqual(steps);
        });

        it("should throw an error if GPT response is invalid", async () => {
            vi.spyOn(gpt, "generateResponse").mockResolvedValueOnce(null);
            const steps = [{ action: "Step 1: Do something" }];
            await expect(validateSteps(steps, gpt, db)).rejects.toThrow( // Pass db as an argument
                "Failed to validate steps using GPT."
            );
        });
    });

    describe("generateGeneralMOPInfo", () => {
        it("should generate general MOP info successfully", async () => {
            const input = {
                prompt: "Install new server rack",
                difficultyLevel: "Medium",
                riskAssessment: "Low",
                context: "Data center upgrade"
            };
            const mockResponse = JSON.stringify({
                title: "Server Rack Installation",
                description: "Procedure to install a new server rack.",
                prerequisites: ["screwdriver", "rack bolts"],
                sections: ["Preparation", "Installation", "Verification"]
            });
            vi.spyOn(gpt, "generateResponse").mockResolvedValueOnce(mockResponse);

            const result = await generateGeneralMOPInfo(gpt, db, input); // Pass db as an argument
            expect(result).toEqual(JSON.parse(mockResponse));
        });

        it("should throw an error if GPT response is invalid", async () => {
            vi.spyOn(gpt, "generateResponse").mockResolvedValueOnce(null);

            const input = {
                prompt: "Install new server rack",
                difficultyLevel: "Medium",
                riskAssessment: "Low",
                context: "Data center upgrade"
            };
            await expect(generateGeneralMOPInfo(gpt, db, input)).rejects.toThrow( // Pass db as an argument
                "Failed to generate general MOP info."
            );
        });
    });

    describe("generateDetailedSteps", () => {
        it("should generate detailed steps for each section", async () => {
            const generalData = {
                title: "Server Rack Installation",
                description: "Procedure to install a new server rack.",
                sections: ["Preparation", "Installation"]
            };
            const mockResponses = [
                JSON.stringify([{ action: "Gather tools" }, { action: "Inspect rack location" }]),
                JSON.stringify([{ action: "Use screwdriver to secure rack bolts" }])
            ];
            vi.spyOn(gpt, "generateResponse")
                .mockResolvedValueOnce(mockResponses[0])
                .mockResolvedValueOnce(mockResponses[1]);

            const result = await generateDetailedSteps(gpt, db, generalData); // Pass db as an argument
            expect(result).toEqual([
                { action: "Gather tools" },
                { action: "Inspect rack location" },
                { action: "Use screwdriver to secure rack bolts" }
            ]);
        });

        it("should throw an error if GPT response is invalid for a section", async () => {
            const generalData = {
                title: "Server Rack Installation",
                description: "Procedure to install a new server rack.",
                sections: ["Preparation"]
            };
            vi.spyOn(gpt, "generateResponse").mockResolvedValueOnce(null);

            await expect(generateDetailedSteps(gpt, db, generalData)).rejects.toThrow( // Pass db as an argument
                "Failed to generate steps for section: Preparation"
            );
        });
    });
});
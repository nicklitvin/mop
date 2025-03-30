import { describe, it, expect, vi, beforeEach } from "vitest";
import { API } from "../src/api";
import testLog from "../logs/test_log.json"; // Ensure --resolveJsonModule is enabled in tsconfig

describe("API Class", () => {
    let api: API;
    let mockDB: { createMOP: ReturnType<typeof vi.fn>; getMOP: ReturnType<typeof vi.fn> }; // Properly type mockDB
    let mockGPT: { generateResponse: ReturnType<typeof vi.fn> }; // Properly type mockGPT

    beforeEach(() => {
        mockDB = {
            createMOP: vi.fn(), // Mock the createMOP method
            getMOP: vi.fn(), // Mock the getMOP method
        };

        mockGPT = {
            generateResponse: vi.fn(), // Mock the generateResponse method
        };

        api = new API();
        (api as any).db = mockDB;
        (api as any).gpt = mockGPT;
    });

    it("should create a MOP and save it to the database", async () => {
        // Mock GPT responses using test_log.json outputs
        let gptCallIndex = 0;
        mockGPT.generateResponse.mockImplementation(() => {
            const response = testLog.outputs[gptCallIndex];
            gptCallIndex++;
            return Promise.resolve(response);
        });

        // Mock input
        const input = {
            prompt: "Network switch upgrades",
            difficultyLevel: "Medium",
            riskAssessment: "Medium",
            context: "Upgrading network switches in a data center",
        };

        // Mock DB response
        mockDB.createMOP.mockImplementation(async (data) => ({
            ...data,
            id: 1,
            steps: data.steps.map((step, index) => ({
                ...step,
                id: index + 1,
                notes: [],
                mopId: 1,
            })),
        }));

        // Call createMOP
        const result = await api.createMOP(input);

        // Assertions
        expect(mockGPT.generateResponse).toHaveBeenCalledTimes(testLog.outputs.length);
        // console.log(result.data.prerequisites);
    });
});

import { useState } from "react";
import { callAPI } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOP, Step } from "../lib/types";

export function Home() {
    const [prompt, setPrompt] = useState<string>("");
    const [mopData, setMopData] = useState<MOP | null>(null);

    const handleSubmit = async () => {
        const response = await callAPI<MOP>({
            method: "POST",
            url: "/createMOP", // Updated URL
            payload: { prompt }
        });
        setMopData(response);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <h1 className="font-bold text-xl">Home</h1>
            <div className="flex space-x-2">
                <Input
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <Button onClick={handleSubmit}>Submit</Button>
            </div>
            {mopData && (
                <div className="space-y-4">
                    {/* Basic MOP Information */}
                    <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                        <h2 className="font-bold text-lg">Basic Information</h2>
                        <p><strong>ID:</strong> {mopData.id}</p>
                        <p><strong>Title:</strong> {mopData.title}</p>
                        <p><strong>Description:</strong> {mopData.description}</p>
                        <p><strong>Date Created:</strong> {new Date(mopData.dateCreated).toLocaleString()}</p>
                        <p><strong>Version:</strong> {mopData.version}</p>
                    </div>

                    {/* Prerequisites */}
                    <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                        <h2 className="font-bold text-lg">Prerequisites</h2>
                        <ul className="list-disc list-inside">
                            {mopData.prerequisites.map((prerequisite, index) => (
                                <li key={index}>{prerequisite}</li>
                            ))}
                        </ul>
                    </div> 

                    {/* Steps */}
                    <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                        <h2 className="font-bold text-lg">Steps</h2>
                        <ol className="list-decimal list-inside">
                            {mopData.steps.map((step: Step) => (
                                <li key={step.id}>
                                    Step {step.stepNumber}: {step.action}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { callAPI } from "../lib/utils";
import { LoadingSpinner } from "../components/ui/spinner";
import { Button } from "../components/ui/button";
import { MOP, Step } from "../lib/types";

export function Prompt() {
    const [searchParams] = useSearchParams();
    const [mopData, setMopData] = useState<MOP | null>(null);
    const navigate = useNavigate();
    const mopId = searchParams.get("id");

    useEffect(() => {
        const fetchMOP = async () => {
            if (mopId) {
                const id = parseInt(mopId, 10); // Parse id as a number
                if (!isNaN(id)) {
                    const payload = { id }; // Create payload object
                    const data = await callAPI<MOP>({
                        method: "GET",
                        url: "/getMOP", // Update URL to match allowed values
                        payload
                    });
                    setMopData(data); // Save response to mopData
                }
            }
        };
        fetchMOP();
    }, [mopId]);

    if (!mopData) {
        return (
            <div className="flex flex-1 justify-center items-center h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-1 justify-center items-center py-8">
            <div className="space-y-4 max-w-3xl w-full">
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
                                {step.action}
                            </li>
                        ))}
                    </ol>
                </div>

                <Button onClick={() => navigate("/")} className="w-36">
                    Go Home
                </Button>
            </div>
        </div>
    );
}

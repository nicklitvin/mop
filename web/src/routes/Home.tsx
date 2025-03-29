import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { callAPI } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/spinner";
import { MOP } from "../lib/types";

export function Home() {
    const [prompt, setPrompt] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [mopId, setMopId] = useState<string>(""); // State for MOP ID input
    const navigate = useNavigate(); // Initialize navigate

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const response = await callAPI<MOP>({
                method: "POST",
                url: "/createMOP",
                payload: { prompt }
            });
            if (response) {
                navigate(`/prompt?id=${Number(response.id)}`); // Ensure id is passed as a number
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigateToPrompt = () => {
        if (mopId) {
            navigate(`/prompt?id=${mopId}`);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="flex flex-col space-y-2 items-center">
                <Input
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-64"
                />
                <Button onClick={handleSubmit} disabled={isLoading} className="w-36">
                    {isLoading ? <LoadingSpinner /> : "Submit"}
                </Button>
            </div>
            <div className="flex flex-col space-y-2 items-center pt-10">
                <Input
                    placeholder="Enter MOP ID"
                    value={mopId}
                    onChange={(e) => setMopId(e.target.value)}
                    className="w-64"
                />
                <Button onClick={handleNavigateToPrompt} className="w-36">
                    Go to Prompt
                </Button>
            </div>
        </div>
    );
}
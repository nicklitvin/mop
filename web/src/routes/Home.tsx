import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { callAPI } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"; // Import ShadCN Select components
import { MOP, MOPInput } from "../lib/types"; // Import MOPInput interface

export function Home() {
    const [prompt, setPrompt] = useState<string>("");
    const [difficultyLevel, setDifficultyLevel] = useState<string>(""); // State for difficulty level
    const [riskAssessment, setRiskAssessment] = useState<string>(""); // State for risk assessment
    const [context, setContext] = useState<string>(""); // State for context
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [mopId, setMopId] = useState<string>(""); // State for MOP ID input
    const navigate = useNavigate(); // Initialize navigate

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const mopInput: MOPInput = {
                prompt,
                difficultyLevel,
                riskAssessment,
                context,
            };
            const response = await callAPI<MOP>({
                method: "POST",
                url: "/createMOP",
                payload: mopInput,
            });
            if (response) {
                navigate(`/mop?id=${Number(response.id)}`); // Ensure id is passed as a number
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigateToPrompt = () => {
        if (mopId) {
            navigate(`/mop?id=${mopId}`);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="flex flex-col space-y-2 items-center">
                <label className="w-64 text-left">Prompt</label>
                <Input
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-64"
                />
                <label className="w-64 text-left">Difficulty Level</label>
                <Select onValueChange={setDifficultyLevel}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select Difficulty Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
                <label className="w-64 text-left">Risk Assessment</label>
                <Select onValueChange={setRiskAssessment}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select Risk Assessment" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                </Select>
                <label className="w-64 text-left">Context</label>
                <Input
                    placeholder="Enter context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="w-64"
                />
                <Button onClick={handleSubmit} disabled={isLoading} className="w-36">
                    {isLoading ? <LoadingSpinner /> : "Submit"}
                </Button>
            </div>
            <div className="flex flex-col space-y-2 items-center pt-10">
                <label className="w-64 text-left">MOP ID</label>
                <Input
                    placeholder="Enter MOP ID"
                    value={mopId}
                    onChange={(e) => setMopId(e.target.value)}
                    className="w-64"
                />
                <Button onClick={handleNavigateToPrompt} className="w-36">
                    Go to MOP
                </Button>
            </div>
        </div>
    );
}
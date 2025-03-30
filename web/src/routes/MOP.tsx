import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { callAPI } from "../lib/utils";
import { LoadingSpinner } from "../components/ui/spinner";
import { Button } from "../components/ui/button";
import { MOP, Step } from "../lib/types";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { toast } from "sonner"; // Import toast for notifications

export function MOPPage() {
    const [searchParams] = useSearchParams();
    const [mopData, setMopData] = useState<MOP | null>(null);
    const [comment, setComment] = useState(""); // State for input box
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

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast("Comment cannot be empty.");
            return;
        }

        const response = await callAPI({
            method: "POST",
            url: "/updatePrompt",
            payload: { comment },
        });

        if (response) {
            toast("Submission successful!");
            setComment(""); // Clear input box
        }
    };

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
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-11/12">Item</TableHead>
                                <TableHead className="w-1/12">Initials</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mopData.prerequisites.map((prerequisite, index) => (
                                <TableRow key={index}>
                                    <TableCell className="w-11/12 whitespace-normal">{prerequisite}</TableCell>
                                    <TableCell className="w-1/12"></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Steps */}
                <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                    <h2 className="font-bold text-lg">Steps</h2>
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/12">Step #</TableHead>
                                <TableHead className="w-5/6">Action</TableHead>
                                <TableHead className="w-1/12">Initials</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mopData.steps.map((step: Step, index) => (
                                <TableRow key={step.id}>
                                    <TableCell className="w-1/12">{index + 1}</TableCell>
                                    <TableCell className="w-5/6 whitespace-normal">{step.action}</TableCell>
                                    <TableCell className="w-1/12"></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Add Comment */}
                <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                    <h2 className="font-bold text-lg">Provide Feedback</h2>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2"
                        placeholder="Enter your feedback here..."
                    />
                    <Button onClick={handleSubmit} className="w-36">
                        Submit
                    </Button>
                </div>

                <Button onClick={() => navigate("/")} className="w-36">
                    Go Home
                </Button>
            </div>
        </div>
    );
}

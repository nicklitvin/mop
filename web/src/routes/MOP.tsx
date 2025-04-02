import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { callAPI } from "../lib/utils";
import { LoadingSpinner } from "../components/ui/spinner";
import { Button } from "../components/ui/button";
import { MOP, Step } from "../lib/types";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { toast } from "sonner"; // Import toast for notifications
import { Input } from "../components/ui/input"; // Import ShadCN Input

export function MOPPage() {
    const [searchParams] = useSearchParams();
    const [mopData, setMopData] = useState<MOP | null>(null);
    const [comment, setComment] = useState(""); // State for input box
    const [selectedVersion, setSelectedVersion] = useState<number | null>(null); // State for version selection
    const [updatedMOP, setUpdatedMOP] = useState(""); // State for MOP update
    const [loadingButton, setLoadingButton] = useState<string | null>(null); // Track which button is loading
    const [changes, setChanges] = useState<{ version: number; field: string; oldValue: string; newValue: string; stepNumber?: number }[] | null>(null); // State for changes
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

    useEffect(() => {
        const fetchChanges = async () => {
            if (mopId) {
                const id = parseInt(mopId, 10);
                if (!isNaN(id)) {
                    const data = await callAPI<{ version: number; field: string; oldValue: string; newValue: string; stepNumber?: number }[] | null>({
                        method: "GET",
                        url: "/getMOPChanges",
                        payload: { id },
                    });
                    setChanges(data || []); // Set changes to an empty array if no data is returned
                }
            }
        };
        fetchChanges();
    }, [mopId]);

    const groupedChanges = changes?.reduce((acc, change) => {
        if (!acc[change.version]) {
            acc[change.version] = [];
        }
        acc[change.version].push(`${change.field}: ${change.oldValue} -> ${change.newValue}`);
        return acc;
    }, {} as Record<number, string[]>);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast("Comment cannot be empty.");
            return;
        }

        setLoadingButton("submit"); // Set loading state for submit button
        try {
            const response = await callAPI({
                method: "POST",
                url: "/updatePrompt",
                payload: { comment },
            });

            if (response) {
                toast("Feedback accepted successfully!"); // Show success toast
                setComment(""); // Clear input box
            }
        } finally {
            setLoadingButton(null); // Reset loading state
        }
    };

    const handleVersionChange = async () => {
        if (selectedVersion === null || isNaN(selectedVersion)) {
            toast("Please select a valid version.");
            return;
        }

        setLoadingButton("versionChange"); // Set loading state for version change button
        try {
            const data = await callAPI<MOP>({
                method: "GET",
                url: "/getMOPVersion",
                payload: { id: mopId, version: selectedVersion },
            });

            if (data) {
                setMopData(data);
                toast("Version changed successfully!"); // Show success toast
                setSelectedVersion(null); // Clear input box
            }
        } finally {
            setLoadingButton(null); // Reset loading state
        }
    };

    const handlePreviousVersion = async () => {
        if (!mopData || mopData.version <= 1) {
            toast("No previous version available.");
            return;
        }

        setLoadingButton("previousVersion"); // Set loading state for previous version button
        try {
            const data = await callAPI<MOP>({
                method: "GET",
                url: "/getMOPVersion",
                payload: { id: mopId, version: mopData.version - 1 },
            });

            if (data) {
                setMopData(data);
                toast("Previous version loaded successfully!"); // Show success toast
            }
        } finally {
            setLoadingButton(null); // Reset loading state
        }
    };

    const handleMOPUpdate = async () => {
        if (!updatedMOP.trim()) {
            toast("Updated MOP content cannot be empty.");
            return;
        }

        setLoadingButton("updateMOP"); // Set loading state for update MOP button
        try {
            const response = await callAPI({
                method: "POST",
                url: "/updateMOP",
                payload: { id: mopId, prompt: updatedMOP },
            });

            if (response) {
                toast("MOP updated successfully!");
                setUpdatedMOP(""); // Clear input box

                // Refetch MOP and changes
                const fetchMOP = async () => {
                    if (mopId) {
                        const id = parseInt(mopId, 10);
                        if (!isNaN(id)) {
                            const payload = { id };
                            const data = await callAPI<MOP>({
                                method: "GET",
                                url: "/getMOP",
                                payload,
                            });
                            setMopData(data);
                        }
                    }
                };

                const fetchChanges = async () => {
                    if (mopId) {
                        const id = parseInt(mopId, 10);
                        if (!isNaN(id)) {
                            const data = await callAPI<{ version: number; field: string; oldValue: string; newValue: string; stepNumber?: number }[] | null>({
                                method: "GET",
                                url: "/getMOPChanges",
                                payload: { id },
                            });
                            setChanges(data || []);
                        }
                    }
                };

                await Promise.all([fetchMOP(), fetchChanges()]);
            }
        } finally {
            setLoadingButton(null); // Reset loading state
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
                                <TableHead className="w-full">Item</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mopData.prerequisites.map((prerequisite, index) => (
                                <TableRow key={index}>
                                    <TableCell className="w-full whitespace-normal">{prerequisite}</TableCell>
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
                                <TableHead className="w-11/12">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mopData.steps.map((step: Step, index) => (
                                <TableRow key={step.id}>
                                    <TableCell className="w-1/12">{index + 1}</TableCell>
                                    <TableCell className="w-11/12 whitespace-normal">{step.action}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Changes Table */}
                <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                    <h2 className="font-bold text-lg">Change History</h2>
                    {groupedChanges && Object.keys(groupedChanges).length > 0 ? (
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/4">Version</TableHead>
                                    <TableHead className="w-3/4">Changes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(groupedChanges).map(([version, changes]) => (
                                    <TableRow key={version}>
                                        <TableCell className="w-1/4">{version}</TableCell>
                                        <TableCell className="w-3/4">
                                            <ul className="list-disc pl-5">
                                                {changes.map((change, index) => (
                                                    <li key={index}>{change}</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-gray-500">There have been no changes for this MOP.</p>
                    )}
                </div>

                {/* Select Version */}
                <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                    <h2 className="font-bold text-lg">Select MOP Version</h2>
                    <div className="flex items-center space-x-2">
                        <Input
                            type="number"
                            value={selectedVersion ?? ""}
                            onChange={(e) => setSelectedVersion(parseInt(e.target.value, 10))}
                            className="w-full"
                            placeholder="Enter version number"
                        />
                        <Button onClick={handleVersionChange} disabled={loadingButton === "versionChange"} className="w-36">
                            {loadingButton === "versionChange" ? <LoadingSpinner /> : "Load Version"}
                        </Button>
                        <Button onClick={handlePreviousVersion} disabled={loadingButton === "previousVersion"} className="w-36">
                            {loadingButton === "previousVersion" ? <LoadingSpinner /> : "Previous Version"}
                        </Button>
                    </div>
                </div>

                {/* Update MOP */}
                <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                    <h2 className="font-bold text-lg">Update MOP</h2>
                    <Input
                        value={updatedMOP}
                        onChange={(e) => setUpdatedMOP(e.target.value)}
                        className="w-full"
                        placeholder="How would you like to update this MOP?"
                    />
                    <Button onClick={handleMOPUpdate} disabled={loadingButton === "updateMOP"} className="w-36">
                        {loadingButton === "updateMOP" ? <LoadingSpinner /> : "Update MOP"}
                    </Button>
                </div>

                {/* Add Comment */}
                <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                    <h2 className="font-bold text-lg">Provide Feedback</h2>
                    <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full"
                        placeholder="How would you like future MOPs to be improved?"
                    />
                    <Button onClick={handleSubmit} disabled={loadingButton === "submit"} className="w-36">
                        {loadingButton === "submit" ? <LoadingSpinner /> : "Submit"}
                    </Button>
                </div>

                <Button onClick={() => navigate("/")} className="w-36">
                    Go Home
                </Button>
            </div>
        </div>
    );
}

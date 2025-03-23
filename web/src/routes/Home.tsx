import { useState } from "react"
import { callAPI } from "../lib/utils";
import { Button } from "@/components/ui/button";

export function Home() {
    const [data, setData] = useState<string>();

    const hi = async () => {
        console.log("hh")
        const response = await callAPI<string>({
            method: "GET",
            url: "/hi"
        })
        setData(response || "");
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="font-bold">Home</h1>
            {/* <button onClick={hi}>Get</button> */}
            <Button onClick={hi}>Get</Button>
            <p>{data}</p>
        </div>
    )
}
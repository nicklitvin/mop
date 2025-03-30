import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"
import { APIOutput } from "./types";
import { toast } from "sonner"; // Import the toast function

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

export type URL = "/hi" | "/createMOP" | "/getMOP" | "/updatePrompt" | "/lastMOP"; 

export const callAPI = async <T>({ method, url, payload } : {
    method: "GET" | "POST",
    url: URL,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any
}) : Promise<T|null> => {
    try {
        const response = method === "GET" ?
            await api.get(url, { params : payload }) :
            await api.post(url, payload);
        const output : APIOutput<T> = response.data;

        if (output.message) { // Check if there's a message in the response
            toast(output.message); // Display the message as a toast
        }

        return output.data ?? null;
    } catch (err) {
        console.log(err);
        toast("An error occurred while calling the API.");
        return null;
    }
}


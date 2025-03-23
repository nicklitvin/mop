import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"
import { APIOutput } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

export type URL = "/hi";

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
        
        return output.data ?? null;
    } catch (err) {
        console.log(err);
        return null
    }
}


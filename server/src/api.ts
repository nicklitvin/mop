import { APIOutput } from "./types";
import { DB } from "./db";

export class API {
    private db : DB;

    constructor() {
        this.db = new DB();
    }

    async hi() : Promise<APIOutput<string>>{
        return Promise.resolve({
            data: "hi"
        })
    }
}
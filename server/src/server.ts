import { API } from "./api";
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";

export class Server {
    private api : API;
    private readonly URLS = {
        hi: "/api/hi"
    }

    constructor({ useBuild } : {
        useBuild: boolean
    }) {
        this.api = new API();
        const app = express();
        app.listen(process.env.LISTEN_PORT);
        express.json();

        app.use(cors({
            origin: process.env.WEB_IP,
            methods: ["GET", "POST"],
            // credentials: true
        }))

        if (useBuild) {
            app.use(express.static(path.join(__dirname, "../../web/dist")));
            app.get("*", (req, res) => {
                res.sendFile(path.join(__dirname, "../../web/dist"))
            })
        }

        app.get(this.URLS.hi, this.hi.bind(this));
    }

    async hi(req : Request, res : Response) {
        try {
            const out = await this.api.hi();
            return res.status(out.message ? 400 : 200).json(out);
        } catch (err) {
            return res.status(500).json(err);
        }
    }
}
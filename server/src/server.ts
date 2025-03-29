import { API } from "./api";
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";

export class Server {
    private api: API;
    private readonly URLS = {
        hi: "/api/hi",
        createMOP: "/api/createMOP", // Updated URL
        getMOP: "/api/getMOP", // New URL
    };

    constructor({ useBuild, useMock }: { useBuild: boolean; useMock: boolean }) {
        this.api = new API(useMock);
        const app = express();
        app.use(express.json()); // Apply JSON middleware
        app.listen(process.env.LISTEN_PORT);

        app.use(
            cors({
                origin: process.env.WEB_IP,
                methods: ["GET", "POST"],
            })
        );

        if (useBuild) {
            app.use(express.static(path.join(__dirname, "../../web/dist")));
            app.get("*", (req, res) => {
                res.sendFile(path.join(__dirname, "../../web/dist"));
            });
        }

        app.get(this.URLS.hi, this.hi.bind(this));
        app.post(this.URLS.createMOP, this.createMOP.bind(this)); // Updated URL usage
        app.get(this.URLS.getMOP, this.getMOP.bind(this)); // Add new endpoint
    }

    async hi(req: Request, res: Response) {
        try {
            const out = await this.api.hi();
            return res.status(out.message ? 400 : 200).json(out);
        } catch (err) {
            return res.status(500).json(err);
        }
    }

    async createMOP(req: Request, res: Response) {
        try {
            if (!req.body || !req.body.prompt) {
                return res.status(400).json({ message: "Prompt is required" });
            }

            const out = await this.api.createMOP(req.body.prompt); 
            return res.status(out.message ? 400 : 200).json(out);
        } catch (err) {
            return res.status(500).json(err);
        }
    }

    async getMOP(req: Request, res: Response) {
        try {
            const id = parseInt(req.query.id as string, 10); // Parse id as a number
            if (isNaN(id)) {
                return res.status(400).json({ message: "ID must be a number" });
            }
            const mop = await this.api.getMOP(id);
            return res.status(200).json(mop);
        } catch (err) {
            return res.status(500).json(err);
        }
    }
}
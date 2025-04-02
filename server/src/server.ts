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
        updatePrompt: "/api/updatePrompt", // New URL
        lastMOP: "/api/lastMOP", // New URL
        updateMOP: "/api/updateMOP", // New URL
        getMOPVersion: "/api/getMOPVersion", // New URL
        getMOPChanges: "/api/getMOPChanges", // New URL
    };

    constructor({ useBuild }: { useBuild: boolean }) {
        this.api = new API();
        const app = express();
        app.use(express.json()); // Apply JSON middleware
        app.listen(process.env.LISTEN_PORT);

        app.use(
            cors({
                origin: process.env.WEB_IP,
                methods: ["GET", "POST"],
            })
        );

        app.get(this.URLS.hi, this.hi.bind(this));
        app.post(this.URLS.createMOP, this.createMOP.bind(this)); // Updated URL usage
        app.get(this.URLS.getMOP, this.getMOP.bind(this)); // Add new endpoint
        app.post(this.URLS.updatePrompt, this.updatePrompt.bind(this)); // Add new endpoint
        app.get(this.URLS.lastMOP, this.getLastMOP.bind(this)); // Add new endpoint
        app.post(this.URLS.updateMOP, this.updateMOP.bind(this)); // Add new endpoint
        app.get(this.URLS.getMOPVersion, this.getMOPVersion.bind(this)); // Add new endpoint
        app.get(this.URLS.getMOPChanges, this.getMOPChanges.bind(this)); // Add new endpoint

        if (useBuild) {
            app.use(express.static(path.join(__dirname, "../../web/dist")));
            app.get("*", (req, res) => {
                res.sendFile(path.join(__dirname, "../../web/dist/index.html"));
            });
        }
    }

    async hi(req: Request, res: Response) {
        try {
            const out = await this.api.hi();
            return res.status(out.message ? 400 : 200).json(out);
        } catch (err) {
            console.error(err); // Log the error
            return res.status(500).json(err);
        }
    }

    async createMOP(req: Request, res: Response) {
        try {
            if (!req.body || !req.body.prompt) {
                return res.status(400).json({ message: "Prompt is required" });
            }

            const out = await this.api.createMOP({
                prompt: req.body.prompt,
                difficultyLevel: req.body.difficultyLevel, // Optional
                riskAssessment: req.body.riskAssessment, // Optional
                context: req.body.context, // Optional
            });
            return res.status(out.message ? 400 : 200).json(out);
        } catch (err) {
            console.error(err); // Log the error
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
            console.error(err); // Log the error
            return res.status(500).json(err);
        }
    }

    async updatePrompt(req: Request, res: Response) {
        try {
            const { comment }: { comment: string } = req.body;
            if (!comment) {
                return res.status(400).json({ message: "Comment is required" });
            }

            // Call the API to handle the update
            const updatedPrompt = await this.api.updatePrompt({ comment });
            return res.status(200).json(updatedPrompt);
        } catch (err) {
            console.error(err); // Log the error
            return res.status(500).json(err);
        }
    }

    async getLastMOP(req: Request, res: Response) {
        try {
            const lastMOP = await this.api.getLastMOP();
            return res.status(lastMOP.message ? 400 : 200).json(lastMOP);
        } catch (err) {
            console.error(err); // Log the error
            return res.status(500).json(err);
        }
    }

    async updateMOP(req: Request, res: Response) {
        try {
            const id = parseInt(req.body.id, 10);
            const prompt = req.body.prompt;

            if (!id || !prompt) {
                return res.status(400).json({ message: "Invalid request data" });
            }

            const result = await this.api.updateMOP({ id, prompt });
            return res.status(result.message ? 400 : 200).json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json(err);
        }
    }

    async getMOPVersion(req: Request, res: Response) {
        try {
            const id = parseInt(req.query.id as string, 10);
            const version = parseInt(req.query.version as string, 10);

            if (isNaN(id) || isNaN(version)) {
                return res.status(400).json({ message: "ID and version must be numbers" });
            }

            const result = await this.api.getMOPVersion({ id, version });
            return res.status(result.message ? 400 : 200).json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json(err);
        }
    }

    async getMOPChanges(req: Request, res: Response) {
        try {
            const id = parseInt(req.query.id as string, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: "ID must be a number" });
            }

            const changes = await this.api.getMOPChanges(id);
            return res.status(changes.message ? 400 : 200).json(changes);
        } catch (err) {
            console.error(err);
            return res.status(500).json(err);
        }
    }
}
import { config } from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Server } from "./src/server";
import { DB } from "./src/db"; // Import DB for resetting the database

export async function main() {
    config();

    const args = await yargs(hideBin(process.argv))
        .option('build', {
            alias: 'b',
            type: 'boolean',
            description: 'Use frontend build'
        })
        .option('reset', {
            alias: 'r',
            type: 'boolean',
            description: 'Reset the database by deleting all content'
        })
        .help('h')
        .alias('h', 'help')
        .parse();

    if (args.reset) {
        const db = new DB();
        console.log("Resetting the database...");
        await db.resetDatabase(); // Call the reset method
        console.log("Database reset complete.");
        return; // Exit after resetting the database
    }

    new Server({
        useBuild: Boolean(args.build)
    });
}

main();
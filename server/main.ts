import { config } from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Server } from "./src/server";

export async function main() {
    config()

    const args = await yargs(hideBin(process.argv))
        .option('build', {
            alias: 'b',
            type: 'boolean',
            description: 'Use frontend build'
        })
        .help('h')
        .alias('h', 'help')
        .parse()
    
    new Server({
        useBuild: Boolean(args.build)
    })
}

main()
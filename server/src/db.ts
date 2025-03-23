import { PrismaClient } from "@prisma/client"

export class DB {
    private prisma : PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // async sample() {
    //     return await this.prisma.user.create({})
    // }
}
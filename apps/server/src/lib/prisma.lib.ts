import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { databaseUrl } from "../config/db.config";

const adapter = new PrismaPg({ connectionString: databaseUrl() });
const prisma = new PrismaClient({ adapter });

export { prisma };

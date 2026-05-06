import { PrismaClient } from "@prisma/client";
import path from "path";

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
  const workspaceRoot = process.env.RALPH_WORKSPACE_ROOT?.trim();
  const dbPath = workspaceRoot
    ? path.join(workspaceRoot, "apps", "open-graze", "prisma", "dev.db")
    : path.join(process.cwd(), "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${dbPath}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

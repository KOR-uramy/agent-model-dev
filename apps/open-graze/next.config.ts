import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** open-graze 패키지 루트 (모노레포에서 `npm run dev -w` 시 cwd가 루트일 수 있음) */
const packageDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * 로컬에서 `.env` 없이 `npm run dev`만 할 때 Prisma가 죽지 않게 기본 DB URL.
 * (배포는 반드시 `DATABASE_URL`을 명시할 것.)
 */
if (
  process.env.NODE_ENV !== "production" &&
  (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "")
) {
  process.env.DATABASE_URL = `file:${path.join(packageDir, "prisma", "dev.db")}`;
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

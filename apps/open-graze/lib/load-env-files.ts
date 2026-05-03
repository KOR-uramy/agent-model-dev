import fs from "fs";
import path from "path";

/** `KEY=value` / `#` 주석. 값에만 따옴표 허용. 이미 설정된 `process.env[key]`는 건드리지 않음. */
export function mergeEnvFileIntoProcess(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[\w.-]+$/.test(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    const cur = process.env[key];
    if (cur === undefined || cur === "") {
      process.env[key] = val;
    }
  }
}

/** 모노레포에서 `npm run dev -w open-graze` 시 Next가 앱 `.env`를 늦게 읽어도 config 단계에서 주입 */
export function bootstrapAuthEnvFromFiles(packageDir: string): void {
  if (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim()
  ) {
    return;
  }
  const candidates = [
    path.join(packageDir, ".env.local"),
    path.join(packageDir, ".env"),
    path.join(packageDir, "..", "..", ".env.local"),
    path.join(packageDir, "..", "..", ".env"),
  ];
  for (const p of candidates) {
    mergeEnvFileIntoProcess(p);
  }
}

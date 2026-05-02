#!/usr/bin/env node
/**
 * Git post-commit 등에서 호출 — 마지막 커밋 한 건을 workspace-telemetry.jsonl에 남깁니다.
 *
 * 사용: 저장소 루트에서 실행되도록 훅에 넣습니다.
 *   .git/hooks/post-commit  →  npx openg-graze-git-commit
 *
 * `RALPH_WORKSPACE`가 있으면 그 경로 아래 `.ralph/`에 쓰고, 없으면 `git rev-parse --show-toplevel` 결과를 워크스페이스로 씁니다.
 */
import { execSync } from "child_process";
import { TELEGRAM_ENV_KEYS, sendTelegramMessage } from "./telegram";
import { appendWorkspaceTelemetryEvent } from "./telemetry";

function git(cwd: string, args: string): string {
  return execSync(`git ${args}`, {
    encoding: "utf8",
    cwd,
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

async function main(): Promise<void> {
  const cwd = process.cwd();
  let root: string;
  try {
    root = git(cwd, "rev-parse --show-toplevel");
  } catch {
    console.error("openg-graze-git-commit: not inside a git repository.");
    process.exit(1);
  }

  const sha = git(root, "rev-parse HEAD");
  const subject = git(root, "log -1 --pretty=%s");
  const author = git(root, "log -1 --pretty=%an");
  let branch = "";
  try {
    branch = git(root, "rev-parse --abbrev-ref HEAD");
  } catch {
    // detached HEAD 등
  }

  await appendWorkspaceTelemetryEvent(
    {
      cwd: root,
      defaultWorkspaceSegments: [],
      env: process.env,
    },
    {
      kind: "git_commit",
      detail: {
        phase: "end" as const,
        title: subject,
        workId: sha.slice(0, 12),
        notes: branch ? `branch:${branch}` : undefined,
        metadata: { sha, author, branch: branch || undefined },
      },
    },
  );

  if (process.env[TELEGRAM_ENV_KEYS.NOTIFY_COMMITS] === "1") {
    const line = `OpenGraze · git\n<code>${sha.slice(0, 7)}</code> ${escapeHtml(subject)}\n${author}${branch ? ` · ${branch}` : ""}`;
    await sendTelegramMessage(line, {
      env: process.env,
      parseMode: "HTML",
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

main().catch((e) => {
  console.error("openg-graze-git-commit:", e);
  process.exit(1);
});

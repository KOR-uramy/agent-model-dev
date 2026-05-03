/**
 * 로컬 테스트용 사용자·워크스페이스·샘플 작업 생성 · `npm run db:seed -w open-graze`
 * 기본: dev@opengraze.local / opengraze-dev
 */
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const dbUrl =
  process.env.DATABASE_URL ||
  `file:${path.join(__dirname, "dev.db")}`;

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function main() {
  const email = process.env.SEED_USER_EMAIL || "dev@opengraze.local";
  const password = process.env.SEED_USER_PASSWORD || "opengraze-dev";
  const passwordHash = bcrypt.hashSync(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: "로컬 개발자",
      emailVerified: new Date(),
    },
    create: {
      email,
      name: "로컬 개발자",
      emailVerified: new Date(),
      passwordHash,
    },
  });
  // eslint-disable-next-line no-console
  console.log(`Seeded user: ${email} (password: ${password})`);

  const slug = process.env.SEED_WORKSPACE_SLUG || "opengraze-monitoring";
  const existingWs = await prisma.workspace.findUnique({ where: { slug } });
  let ws = existingWs;
  if (existingWs && existingWs.ownerId !== user.id) {
    // eslint-disable-next-line no-console
    console.warn(
      `Workspace slug "${slug}" is owned by another user; skip workspace/task seed.`,
    );
  } else if (!existingWs) {
    ws = await prisma.workspace.create({
      data: {
        name: "에이전트 작업 모니터링(시드)",
        slug,
        ownerId: user.id,
        members: { create: { userId: user.id, role: "owner" } },
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Seeded workspace: ${slug}`);
  }

  if (ws && ws.ownerId === user.id) {
    const seedTitle =
      process.env.SEED_TASK_TITLE ||
      "회원가입·작업 API·대시보드 조회 (시드 테스트)";
    const dup = await prisma.workspaceTask.findFirst({
      where: { workspaceId: ws.id, title: seedTitle },
    });
    if (!dup) {
      await prisma.workspaceTask.create({
        data: {
          workspaceId: ws.id,
          title: seedTitle,
          description:
            "요구사항 반영용 샘플입니다. 상태 변경은 PATCH /api/workspaces/{slug}/tasks/{id} 로 하세요.",
          status: "in_progress",
          createdById: user.id,
        },
      });
      // eslint-disable-next-line no-console
      console.log(`Seeded sample task in ${slug}: ${seedTitle}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * 로컬 테스트용 사용자 생성 · `npm run db:seed -w open-graze`
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
  await prisma.user.upsert({
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { methodNotAllowed } from "@/lib/route-method-not-allowed";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const MIN_PASSWORD_LEN = 8;
const BCRYPT_ROUNDS = 12;

const registerBody = z.object({
  email: z.string().trim().email({ message: "유효한 이메일 주소를 입력하세요." }),
  password: z
    .string()
    .min(MIN_PASSWORD_LEN, { message: `비밀번호는 ${MIN_PASSWORD_LEN}자 이상이어야 합니다.` }),
  name: z.string().trim().max(120).optional().transform((s) => (s === "" ? undefined : s)),
});

export async function GET() {
  return methodNotAllowed("POST");
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  const parsed = registerBody.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.email?.[0]
      ?? parsed.error.flatten().fieldErrors.password?.[0]
      ?? "입력값을 확인해 주세요.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(200),
  name: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) {
    return NextResponse.json(
      { error: "이미 사용 중인 이메일입니다." },
      { status: 409 },
    );
  }

  const passwordHash = bcrypt.hashSync(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name?.length ? parsed.data.name : null,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

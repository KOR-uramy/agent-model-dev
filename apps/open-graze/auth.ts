import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { User as NextAuthUser } from "next-auth";
import authConfig from "./auth.config";
import { prisma } from "@/lib/prisma";

/**
 * DB 비밀번호(Credentials) + JWT 세션.
 * Google OAuth를 다시 쓰려면 `PrismaAdapter` + `Google` provider를 추가하고
 * `session.strategy`를 요구사항에 맞게 조정한다.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "이메일",
      credentials: {
        email: { label: "이메일" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email;
        const passwordRaw = credentials?.password;
        if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
          return null;
        }
        const email = emailRaw.trim();
        if (!email || !passwordRaw) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(passwordRaw, user.passwordHash);
        if (!ok) return null;

        const u: NextAuthUser = {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
        return u;
      },
    }),
  ],
});

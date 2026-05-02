import { prisma } from "@/lib/prisma";

export async function requireWorkspaceMember(slug: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: { members: true },
  });
  if (!workspace) return null;
  const member = workspace.members.find((m) => m.userId === userId);
  if (!member) return null;
  return { workspace, member };
}

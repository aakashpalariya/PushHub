import { getAuthSession } from "./session";
import { prisma } from "../db/prisma";

export async function getRequiredAdmin() {
  const session = await getAuthSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  if (!user || !user.isAdmin) return null;
  return user;
}

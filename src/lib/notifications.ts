import prisma from "@/lib/prisma";

export async function creaNotifica(
  userId: number,
  titolo: string,
  messaggio: string
) {
  return prisma.notification.create({
    data: {
      userId,
      titolo,
      messaggio,
    },
  });
}

export async function creaNotificaAdmin(titolo: string, messaggio: string) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      titolo,
      messaggio,
    })),
  });
}
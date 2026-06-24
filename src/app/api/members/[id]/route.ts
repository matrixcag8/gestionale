import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// DELETE /api/members/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.user.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}

// GET /api/members/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: {
      subscription: {
        include: {
          slots: { include: { slot: true } },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  return NextResponse.json(user);
}

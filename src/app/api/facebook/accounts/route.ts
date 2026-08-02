import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accounts = await db.facebookAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        pageId: true,
        pageName: true,
        tokenExpiresAt: true,
        createdAt: true,
      },
    });
    return Response.json({ accounts });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error getting accounts" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    const deleted = await db.facebookAccount.deleteMany({
      where: { id, userId: session.user.id },
    });
    if (deleted.count === 0) {
      return Response.json({ error: "Account not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error disconnecting" },
      { status: 500 }
    );
  }
}

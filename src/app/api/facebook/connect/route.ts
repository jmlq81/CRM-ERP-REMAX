import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pageId, pageName, accessToken, tokenExpiresAt } = await req.json();
    if (!pageId || !pageName || !accessToken) {
      return Response.json({ error: "pageId, pageName and accessToken are required" }, { status: 400 });
    }

    const expiresAt = tokenExpiresAt ? new Date(tokenExpiresAt) : null;

    const account = await db.facebookAccount.upsert({
      where: {
        userId_pageId: {
          userId: session.user.id,
          pageId,
        },
      },
      update: {
        pageName,
        accessToken,
        tokenExpiresAt: expiresAt,
      },
      create: {
        userId: session.user.id,
        pageId,
        pageName,
        accessToken,
        tokenExpiresAt: expiresAt,
      },
    });

    return Response.json({ success: true, account });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error connecting" },
      { status: 500 }
    );
  }
}

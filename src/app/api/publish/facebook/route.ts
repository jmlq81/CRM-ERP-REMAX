import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { publishToFacebook } from "@/lib/facebook";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { propertyId, facebookAccountId } = await req.json();

    if (!propertyId) {
      return Response.json({ error: "propertyId is required" }, { status: 400 });
    }

    const property = await db.property.findFirst({
      where: { id: propertyId, userId: session.user.id },
      include: { photos: true },
    });

    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    let pageId: string;
    let accessToken: string;

    if (facebookAccountId) {
      const account = await db.facebookAccount.findFirst({
        where: { id: facebookAccountId, userId: session.user.id },
      });
      if (!account) {
        return Response.json({ error: "Facebook account not found" }, { status: 404 });
      }
      pageId = account.pageId;
      accessToken = account.accessToken;
    } else {
      return Response.json(
        { error: "facebookAccountId is required. Conecta tu página de Facebook primero." },
        { status: 400 }
      );
    }

    const message = `${property.title}\n\n${property.description || ""}\n\nPrecio: ${property.price} ${property.currency}\nUbicación: ${property.city}, ${property.address}\n${property.bedrooms ? `${property.bedrooms} hab · ` : ""}${property.bathrooms ? `${property.bathrooms} baños` : ""}`;

    const result = await publishToFacebook({
      accessToken,
      pageId,
      message,
      imageUrl: property.photos[0]?.url,
    });

    await db.publication.create({
      data: {
        platform: "FACEBOOK",
        status: "PUBLISHED",
        externalId: result.id,
        propertyId: property.id,
        userId: session.user.id,
        publishedAt: new Date(),
      },
    });

    return Response.json({ success: true, postId: result.id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error publishing" },
      { status: 500 }
    );
  }
}

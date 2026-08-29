import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { publishToFacebook, publishCarouselToFacebook } from "@/lib/facebook";
import { generatePropertyDescription } from "@/lib/propertyDescription";

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

    const photos = [...property.photos]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => p.url);

    if (photos.length < 3) {
      return Response.json(
        { error: "Se necesitan al menos 3 fotos para publicar en Facebook." },
        { status: 400 }
      );
    }

    const message =
      property.description?.trim() ||
      generatePropertyDescription({
        type: property.type,
        price: Number(property.price),
        currency: property.currency,
        city: property.city,
        district: property.district || undefined,
        area: property.area,
        areaUnit: property.areaUnit,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        featuredText1: property.featuredText1,
        featuredText2: property.featuredText2,
        contactName: property.contactName,
        contactPhone: property.contactPhone,
      });

    let result: { id: string };
    if (property.videoUrl) {
      result = await publishToFacebook({
        accessToken,
        pageId,
        message,
        imageUrl: photos[0],
        link: property.videoUrl,
      });
    } else {
      result = await publishCarouselToFacebook({
        accessToken,
        pageId,
        message,
        imageUrls: photos.slice(0, 10),
      });
    }

    await db.publication.create({
      data: {
        platform: "FACEBOOK",
        status: "PUBLISHED",
        externalId: result.id,
        propertyId: property.id,
        userId: session.user.id,
        companyId: property.companyId,
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

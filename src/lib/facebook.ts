import { db } from "@/lib/prisma";

interface FacebookPublishParams {
  accessToken: string;
  pageId: string;
  message: string;
  imageUrl?: string;
  link?: string;
}

export async function publishToFacebook(
  params: FacebookPublishParams
): Promise<{ id: string }> {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${params.pageId}/photos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: params.imageUrl,
        caption: params.message,
        access_token: params.accessToken,
        published: true,
        ...(params.link ? { link: params.link } : {}),
      }),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function publishCarouselToFacebook(params: {
  accessToken: string;
  pageId: string;
  message: string;
  imageUrls: string[];
}): Promise<{ id: string }> {
  const mediaIds: string[] = [];

  for (const url of params.imageUrls) {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${params.pageId}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          published: false,
          access_token: params.accessToken,
        }),
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    if (!data.id) throw new Error("No se pudo preparar una foto para el carrusel");
    mediaIds.push(data.id);
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${params.pageId}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: params.message,
        attached_media: mediaIds.map((id) => ({ media_fbid: id })),
        access_token: params.accessToken,
      }),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function getPageAccessToken(
  userAccessToken: string,
  pageId: string
): Promise<string> {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${userAccessToken}`
  );
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.access_token;
}

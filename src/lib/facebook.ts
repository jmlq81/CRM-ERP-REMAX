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

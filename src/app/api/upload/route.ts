import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const propertyId = formData.get("propertyId") as string;

    if (!file || !propertyId) {
      return Response.json({ error: "Missing file or propertyId" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const fileName = `${session.user.id}/${propertyId}/${Date.now()}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from("properties")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("properties")
      .getPublicUrl(fileName);

    const photo = await db.propertyPhoto.create({
      data: {
        url: urlData.publicUrl,
        propertyId,
        alt: file.name,
      },
    });

    return Response.json({ photo });
  } catch (error) {
    return Response.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}

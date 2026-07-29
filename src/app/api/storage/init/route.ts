import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    const { data, error } = await supabase.storage.createBucket("properties", {
      public: true,
      fileSizeLimit: 5242880,
    });

    if (error && error.message !== "Bucket already exists") throw error;

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Error creating bucket" },
      { status: 500 }
    );
  }
}

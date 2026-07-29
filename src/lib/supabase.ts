import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadPropertyImage(
  file: File,
  userId: string,
  propertyId: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${userId}/${propertyId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("properties")
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("properties")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function deletePropertyImage(path: string) {
  const { error } = await supabase.storage.from("properties").remove([path]);
  if (error) throw error;
}

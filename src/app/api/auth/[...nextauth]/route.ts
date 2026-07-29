import { handlers } from "@/lib/auth";

export const GET = handlers.GET;

export async function POST(request: Request) {
  try {
    return await handlers.POST(request);
  } catch (error) {
    console.error("Auth callback error:", error);
    return Response.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

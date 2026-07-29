import { db } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  try {
    // Test 1: Create a test user
    const testUser = await db.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
      },
    });
    results.createdUser = { id: testUser.id, email: testUser.email };

    // Test 2: Find user by email
    const foundUser = await db.user.findUnique({
      where: { email: testUser.email },
    });
    results.foundUser = !!foundUser;

    // Test 3: Create an account (simulating OAuth link)
    const account = await db.account.create({
      data: {
        userId: testUser.id,
        type: "oauth",
        provider: "google",
        providerAccountId: `test-${Date.now()}`,
      },
    });
    results.createdAccount = { id: account.id };

    // Test 4: Find account by provider
    const foundAccount = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      include: { user: true },
    });
    results.foundAccount = !!foundAccount;

    // Test 5: Create session
    const session = await db.session.create({
      data: {
        sessionToken: `test-session-${Date.now()}`,
        userId: testUser.id,
        expires: new Date(Date.now() + 86400000),
      },
    });
    results.createdSession = { id: session.id };

    // Test 6: Find session
    const foundSession = await db.session.findUnique({
      where: { sessionToken: session.sessionToken },
      include: { user: true },
    });
    results.foundSession = !!foundSession;

    // Cleanup
    await db.session.delete({ where: { id: session.id } });
    await db.account.delete({ where: { id: account.id } });
    await db.user.delete({ where: { id: testUser.id } });
    results.cleanupDone = true;
  } catch (e) {
    errors.push(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  }

  return Response.json({ status: errors.length === 0 ? "ok" : "error", errors, results });
}

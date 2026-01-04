import { auth } from "@/auth";
import { db, safeDbOperation } from "@/lib/db";

export const ensureUserExists = async () => {
  const session = await auth();

  if (!session?.user?.email) return null;

  return await safeDbOperation(
    async () => {
      let user = await db.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          },
        });
      }

      return user;
    },
    // Return a mock user object for graceful degradation
    {
      id: session.user.id || "mock-id",
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: "USER",
    }
  );
};

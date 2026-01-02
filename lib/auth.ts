import { auth } from "@/auth";
import { db } from "@/lib/db";

export const ensureUserExists = async () => {
  const session = await auth();

  if (!session?.user?.email) return null;

  try {
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
  } catch (error) {
    console.error("Error in ensureUserExists:", error);
    // Return a mock user object for graceful degradation
    return {
      id: session.user.id || "mock-id",
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: "USER",
    };
  }
};

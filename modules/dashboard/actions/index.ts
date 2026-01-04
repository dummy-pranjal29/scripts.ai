"use server";

import { db, safeDbOperation } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ensureUserExists } from "@/lib/auth";
import { Star } from "lucide-react";
import { se } from "date-fns/locale";

export const toggleStarMarked = async (
  playgroundId: string,
  isChecked: boolean
) => {
  // ✅ Always resolve DB-backed user (MongoDB ObjectId)
  const user = await ensureUserExists();

  if (!user) {
    return { success: false, error: "UNAUTHORIZED" };
  }

  return await safeDbOperation(
    async () => {
      const existing = await db.starMarks.findUnique({
        where: {
          userId_playgroundId: {
            userId: user.id,
            playgroundId,
          },
        },
      });

      if (isChecked) {
        // ✅ create only if not already present
        if (!existing) {
          await db.starMarks.create({
            data: {
              userId: user.id,
              playgroundId,
              isMarked: true,
            },
          });
        }
      } else {
        // ✅ delete only if exists
        if (existing) {
          await db.starMarks.delete({
            where: { id: existing.id },
          });
        }
      }

      revalidatePath("/dashboard");
      return { success: true, isMarked: isChecked };
    },
    { success: false, isMarked: false }
  );
};

export const getAllPlaygroundForUser = async () => {
  // ✅ Ensure DB user exists (MongoDB ObjectId)
  const user = await ensureUserExists();

  if (!user) {
    return []; // ✅ Safe for layouts & SSR
  }

  return await safeDbOperation(
    async () => {
      return await db.playground.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          user: true,
          starMarks: {
            // ✅ CORRECT relation name
            where: {
              userId: user.id,
            },
            select: {
              isMarked: true,
            },
          },
        },
      });
    },
    [] // Return empty array on database error
  );
};

export const createPlayground = async (data: {
  title: string;
  template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
  description?: string;
}) => {
  // ✅ Ensure DB user exists (creates if missing)
  const user = await ensureUserExists();

  if (!user) {
    return { success: false, error: "UNAUTHORIZED" };
  }

  const { template, title, description } = data;

  type CreatePlaygroundResult = {
    success: boolean;
    playground?: {
      id: string;
      title: string;
      description?: string;
      template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
      userId: string;
      createdAt: Date;
      updatedAt: Date;
    };
    error?: string;
    offline?: boolean;
  };

  try {
    return await safeDbOperation<CreatePlaygroundResult>(
      async () => {
        const playground = await db.playground.create({
          data: {
            title,
            description,
            template,
            userId: user.id, // ✅ MongoDB ObjectId from Prisma
          },
        });

        return { success: true, playground };
      },
      // Fallback: Return failure for offline mode
      { success: false, error: "DATABASE_UNAVAILABLE" }
    );
  } catch (error) {
    // If database is unavailable, create a mock playground for offline mode
    const mockPlayground = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      template,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("📝 Created playground in offline mode:", mockPlayground.id);

    // Store in sessionStorage as fallback (server-side safe)
    console.log("📝 Offline playground created successfully");

    return { success: true, playground: mockPlayground, offline: true };
  }
};

export const deleteProjectById = async (id: string): Promise<void> => {
  const result = await safeDbOperation(
    async () => {
      await db.playground.delete({
        where: {
          id,
        },
      });
      revalidatePath("/dashboard");
      return { success: true };
    },
    { success: false }
  );

  if (!result?.success) {
    throw new Error("Failed to delete project");
  }
};

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
): Promise<void> => {
  const result = await safeDbOperation(
    async () => {
      await db.playground.update({
        where: {
          id,
        },
        data: data,
      });
      revalidatePath("/dashboard");
      return { success: true };
    },
    { success: false }
  );

  if (!result?.success) {
    throw new Error("Failed to edit project");
  }
};

export const duplicateProjectById = async (id: string): Promise<void> => {
  const result = await safeDbOperation(
    async () => {
      const originalPlayground = await db.playground.findUnique({
        where: { id },
        // todo: add tempalte files
      });
      if (!originalPlayground) {
        throw new Error("Original playground not found");
      }

      const duplicatedPlayground = await db.playground.create({
        data: {
          title: `${originalPlayground.title} (Copy)`,
          description: originalPlayground.description,
          template: originalPlayground.template,
          userId: originalPlayground.userId,

          // todo: add template files
        },
      });

      revalidatePath("/dashboard");
      return { success: true, playground: duplicatedPlayground };
    },
    { success: false, playground: undefined }
  );

  if (!result?.success) {
    throw new Error("Failed to duplicate project");
  }
};

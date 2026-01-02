"use server";

import { db } from "@/lib/db";
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

  try {
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
  } catch (error) {
    console.error("TOGGLE_STAR_ERROR", error);
    return { success: false, error: "FAILED_TO_TOGGLE_STAR" };
  }
};

export const getAllPlaygroundForUser = async () => {
  // ✅ Ensure DB user exists (MongoDB ObjectId)
  const user = await ensureUserExists();

  if (!user) {
    return []; // ✅ Safe for layouts & SSR
  }

  try {
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
  } catch (error) {
    console.error("Error in getAllPlaygroundForUser:", error);
    return []; // Return empty array on database error
  }
};

export const createPlayground = async (data: {
  title: string;
  template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
  description?: string;
}) => {
  // ✅ Ensure DB user exists (creates if missing)
  const user = await ensureUserExists();

  if (!user) {
    return { error: "UNAUTHORIZED" };
  }

  const { template, title, description } = data;

  try {
    const playground = await db.playground.create({
      data: {
        title,
        description,
        template,
        userId: user.id, // ✅ MongoDB ObjectId from Prisma
      },
    });

    return { success: true, playground };
  } catch (error) {
    console.error("CREATE_PLAYGROUND_ERROR", error);
    return { error: "FAILED_TO_CREATE_PLAYGROUND" };
  }
};

export const deleteProjectById = async (id: string) => {
  try {
    await db.playground.delete({
      where: {
        id,
      },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
) => {
  try {
    await db.playground.update({
      where: {
        id,
      },
      data: data,
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

export const duplicateProjectById = async (id: string) => {
  try {
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
    return duplicatedPlayground;
  } catch (error) {
    console.error("Error duplicating project:", error);
  }
};

"use server";

import { db, safeDbOperation } from "@/lib/db";
import { TemplateFolder } from "../lib/template-types";
import { currentUser } from "@/modules/auth/actions";

export const getPlaygroundById = async (id: string) => {
  return await safeDbOperation(async () => {
    const playground = await db.playground.findUnique({
      where: { id },
      select: {
        title: true,
        templateFile: {
          select: {
            content: true,
          },
        },
      },
    });
    return playground;
  }, null);
};

export const SaveUpdatedCode = async (
  playgroundId: string,
  data: TemplateFolder
) => {
  const user = await currentUser();
  if (!user) return null;

  return await safeDbOperation(async () => {
    const updatedPlayground = await db.templateFile.upsert({
      where: {
        playgroundId,
      },
      update: {
        content: JSON.stringify(data),
      },
      create: {
        playgroundId,
        content: JSON.stringify(data),
      },
    });

    return updatedPlayground;
  }, null);
};

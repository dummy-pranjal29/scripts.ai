"use server";

import { auth } from "@/auth";

import { db, safeDbOperation } from "@/lib/db";

export const getUserById = async (id: string) => {
  return await safeDbOperation(
    async () => {
      const user = await db.user.findUnique({
        where: { id },
        include: {
          accounts: true,
        },
      });

      console.log("getUserById result:", {
        id,
        hasAccounts: user?.accounts && user.accounts.length > 0,
        accountCount: user?.accounts?.length || 0,
      });

      return user;
    },
    // Fallback user object for graceful degradation
    {
      id: id,
      email: `user-${id}@fallback.local`,
      name: "User (Offline Mode)",
      image: null,
      role: "USER",
      accounts: [],
    }
  );
};

export const getAccountByUserId = async (userId: string) => {
  return await safeDbOperation(
    async () => {
      const account = await db.account.findFirst({
        where: {
          userId,
        },
      });

      console.log("Account found for user:", {
        userId,
        account: account
          ? {
              id: account.id,
              provider: account.provider,
              hasToken: !!account.access_token,
            }
          : null,
      });

      return account;
    },
    null // Return null for accounts when database is unavailable
  );
};

export const currentUser = async () => {
  const user = await auth();
  return user?.user;
};

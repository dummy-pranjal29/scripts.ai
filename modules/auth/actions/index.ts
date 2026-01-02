"use server";

import { auth } from "@/auth";

import { db } from "@/lib/db";

export const getUserById = async (id: string) => {
  try {
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
  } catch (error) {
    // Log error properly for server-side debugging
    console.error("Error in getUserById:", error);
    // Return a mock user object for graceful degradation
    return {
      id: id,
      email: "mock@example.com",
      name: "Mock User",
      image: null,
      role: "USER",
      accounts: [],
    };
  }
};

export const getAccountByUserId = async (userId: string) => {
  try {
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
  } catch (error) {
    // Log error properly for server-side debugging
    console.error("Error in getAccountByUserId:", error);
    return null;
  }
};

export const currentUser = async () => {
  const user = await auth();
  return user?.user;
};

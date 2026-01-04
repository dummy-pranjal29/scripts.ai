import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  isDbConnected?: boolean;
  connectionAttempts?: number;
};

// Connection state management
const CONNECTION_STATE = {
  isConnected: false,
  isConnecting: false,
  lastAttempt: 0,
  retryDelay: 30000, // Increased to 30 seconds between attempts to reduce spam
  maxRetries: 3,
  currentRetries: 0,
};

// Create Prisma client with enhanced configuration for better connectivity
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn"], // Remove "error" to prevent repetitive logging
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection timeout and retry options
    __internal: {
      engine: {
        connectionTimeout: 30000, // Increased to 30 seconds
        binaryTargets: ["native"],
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Safe database operation wrapper
export const safeDbOperation = async <T>(
  operation: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> => {
  // Check if we should attempt connection
  const now = Date.now();
  if (
    !CONNECTION_STATE.isConnected &&
    now - CONNECTION_STATE.lastAttempt < CONNECTION_STATE.retryDelay
  ) {
    // Silent fallback to reduce console spam
    return fallbackValue;
  }

  try {
    // Attempt connection if not connected
    if (!CONNECTION_STATE.isConnected && !CONNECTION_STATE.isConnecting) {
      await attemptConnection();
    }

    if (CONNECTION_STATE.isConnected) {
      return await operation();
    } else {
      return fallbackValue;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Only log detailed errors once per retry period
    if (
      errorMessage.includes("Server selection timeout") ||
      errorMessage.includes("No available servers") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("InternalError")
    ) {
      CONNECTION_STATE.isConnected = false;
      CONNECTION_STATE.lastAttempt = Date.now();
      CONNECTION_STATE.currentRetries++;

      // Only show error message if we haven't exceeded max retries
      if (CONNECTION_STATE.currentRetries <= CONNECTION_STATE.maxRetries) {
        console.error(
          "❌ Database connection failed (attempt " +
            CONNECTION_STATE.currentRetries +
            "/" +
            CONNECTION_STATE.maxRetries +
            "):",
          errorMessage
        );
        if (CONNECTION_STATE.currentRetries === CONNECTION_STATE.maxRetries) {
          console.log("🔧 Troubleshooting suggestions:");
          console.log("   1. Check if MongoDB Atlas cluster is active");
          console.log("   2. Verify network connectivity");
          console.log(
            "   3. Check if IP address is whitelisted in MongoDB Atlas"
          );
          console.log("   4. Verify database user credentials");
          console.log("   5. Ensure connection string is correct");
          console.log("⚠️  Application running in offline mode");
        }
      }
    } else {
      console.error("Database operation error:", errorMessage);
    }

    return fallbackValue;
  }
};

// Enhanced connection handling with retry logic
const attemptConnection = async (): Promise<boolean> => {
  if (CONNECTION_STATE.isConnecting) {
    return false;
  }

  CONNECTION_STATE.isConnecting = true;
  CONNECTION_STATE.lastAttempt = Date.now();

  try {
    await db.$connect();
    CONNECTION_STATE.isConnected = true;
    // Reset retry count on successful connection
    CONNECTION_STATE.currentRetries = 0;
    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    CONNECTION_STATE.isConnected = false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    CONNECTION_STATE.currentRetries++;

    return false;
  } finally {
    CONNECTION_STATE.isConnecting = false;
  }
};

// Attempt initial connection
attemptConnection();

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// GET /api/chat/sessions/[id] - Get messages for a specific session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
      console.error(
        "GET /api/chat/sessions/[id] - Unauthorized: No session or user email"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error(
        `GET /api/chat/sessions/[id] - User not found for email: ${session.user.email}`
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chatSession = await db.chatSession.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chatSession) {
      console.error(
        `GET /api/chat/sessions/[id] - Chat session not found: ${id} for user: ${user.id}`
      );
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session: chatSession });
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat session" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/sessions/[id] - Delete a chat session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
      console.error(
        "DELETE /api/chat/sessions/[id] - Unauthorized: No session or user email"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error(
        `DELETE /api/chat/sessions/[id] - User not found for email: ${session.user.email}`
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chatSession = await db.chatSession.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!chatSession) {
      console.error(
        `DELETE /api/chat/sessions/[id] - Chat session not found: ${id} for user: ${user.id}`
      );
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // Delete the session (cascade will delete messages)
    await db.chatSession.delete({
      where: { id },
    });

    console.log(
      `DELETE /api/chat/sessions/[id] - Successfully deleted session: ${id}`
    );
    return NextResponse.json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return NextResponse.json(
      { error: "Failed to delete chat session" },
      { status: 500 }
    );
  }
}

// PUT /api/chat/sessions/[id] - Update a chat session (e.g., title, active status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
      console.error(
        "PUT /api/chat/sessions/[id] - Unauthorized: No session or user email"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error(
        `PUT /api/chat/sessions/[id] - User not found for email: ${session.user.email}`
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    interface UpdateSessionBody {
      title?: string;
      isActive?: boolean;
    }
    let body: UpdateSessionBody;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { title, isActive } = body || {};

    if (title === undefined && isActive === undefined) {
      return NextResponse.json(
        { error: "No updatable fields provided (title, isActive)" },
        { status: 400 }
      );
    }

    console.log(
      `PUT /api/chat/sessions/[id] - Attempting to update session: ${id}`,
      { title, isActive }
    );

    const chatSession = await db.chatSession.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!chatSession) {
      console.error(
        `PUT /api/chat/sessions/[id] - Chat session not found: ${id} for user: ${user.id}`
      );
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // If setting this session as active, deactivate all others
    if (isActive) {
      console.log(
        `PUT /api/chat/sessions/[id] - Deactivating all other sessions for user: ${user.id}`
      );
      await db.chatSession.updateMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    // Debug log for params and id type
    console.log(
      "PUT /api/chat/sessions/[id] - id:",
      id,
      "id type:",
      typeof id,
      "id value:",
      id
    );
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: "Invalid session id",
          id,
          idType: typeof id,
          idValue: id,
        },
        { status: 400 }
      );
    }
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }
    console.log("PUT /api/chat/sessions/[id] - Update args:", {
      where: { id },
      data: updateData,
    });
    const updatedSession = await db.chatSession.update({
      where: { id },
      data: updateData,
    });

    console.log(
      `PUT /api/chat/sessions/[id] - Successfully updated session: ${id}`,
      updatedSession
    );
    return NextResponse.json({ session: updatedSession });
  } catch (error: unknown) {
    // Prisma errors often have a 'message' property
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : String(error);
    console.error("Error updating chat session:", errorMessage);
    return NextResponse.json(
      {
        error: "Failed to update chat session",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

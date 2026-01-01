import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// POST /api/chat/messages - Save a message to a session
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { sessionId, role, content, type, tokens, model } = body;

    // Validate required fields
    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { error: "sessionId, role, and content are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["user", "assistant"].includes(role)) {
      return NextResponse.json(
        { error: "role must be 'user' or 'assistant'" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user
    const chatSession = await db.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // Create the message
    const message = await db.chatMessage.create({
      data: {
        userId: user.id,
        sessionId,
        role,
        content,
        type: type || "chat",
        tokens: tokens || null,
        model: model || null,
      },
    });

    // Update the session's updatedAt timestamp
    await db.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}

// GET /api/chat/messages - Get all messages for a session (query param)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user
    const chatSession = await db.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    const messages = await db.chatMessage.findMany({
      where: {
        sessionId,
        userId: user.id,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

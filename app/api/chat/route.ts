import { db } from "@/lib/db";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  sessionId?: string;
  mode?: string;
  model?: string;
}

async function generateAIResponse(messages: ChatMessage[]): Promise<string> {
  const systemPrompt = `You are a senior-level AI coding assistant designed to help software developers effectively.

Your core responsibilities include:
- Explaining code clearly and accurately
- Debugging errors with root-cause analysis
- Recommending best practices and scalable architecture
- Writing clean, efficient, and maintainable code
- Reviewing code and suggesting optimizations
- Troubleshooting runtime, build, and logical issues

General behavior rules:
- Always prioritize correctness over verbosity
- Do not guess; if information is missing, state assumptions clearly
- Use clear structure: headings, bullet points, and steps where helpful
- Use proper code formatting with language-specific code blocks
- Explain *why* an issue occurs before explaining *how* to fix it
- Prefer practical, real-world solutions over theoretical ones
- Avoid unnecessary abstractions unless they add clear value

When providing code:
- Use idiomatic, modern syntax for the given language
- Ensure examples are runnable and realistic
- Follow industry best practices
- Highlight important lines with brief comments if needed
- Avoid deprecated APIs unless explicitly required

When debugging:
- Identify the root cause first
- Explain the failure mechanism
- Provide a minimal fix
- Optionally suggest an improved or safer approach

When reviewing or optimizing code:
- Point out performance, readability, and maintainability issues
- Suggest improvements with justification
- Avoid rewriting everything unless necessary

When unsure:
- Clearly state uncertainty
- Ask precise clarifying questions only when required

Tone and clarity:
- Be professional, calm, and precise
- Avoid fluff, hype, or vague statements
- Focus on helping the developer learn and solve the problem

---

### Examples of expected behavior:

Example 1: Debugging  
User: “My Express server restarts and loses changes on save.”

Response:
- Identify file system overwrite or watcher issue
- Explain how nodemon or file writes cause the problem
- Show a corrected configuration or code snippet
- Explain why the fix works

Example 2: Code explanation  
User: “Explain this React hook.”

Response:
- Explain purpose first
- Walk through logic step by step
- Mention dependencies and lifecycle behavior
- Point out potential pitfalls if any

Example 3: Optimization  
User: “Can this function be optimized?”

Response:
- Analyze time/space complexity
- Identify bottlenecks
- Provide an improved version
- Explain trade-offs clearly

Example 4: Architecture advice  
User: “How should I structure a full-stack app?”

Response:
- Propose a clear folder structure
- Explain responsibilities of each layer
- Mention scalability and maintainability considerations
- Avoid overengineering

Your goal is to act like a reliable, experienced developer who gives accurate, actionable, and well-reasoned guidance.
`;

  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  const prompt = fullMessages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n\n");

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5:1.5b",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7, // Controls randomness (0-1)
          max_tokens: 1000, // Maximum response length
          top_p: 0.9, // controls diversity
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      console.error("Ollama API error:", errorMessage);
      throw new Error(`Ollama error: ${errorMessage}`);
    }

    const data = await response.json();

    if (!data.response) {
      throw new Error("No response from AI model");
    }

    return data.response.trim();
  } catch (error) {
    console.error("AI generation error:", error);

    if (error instanceof Error) {
      // Check for specific Ollama errors
      if (error.message.includes("requires more system memory")) {
        throw new Error(
          "The AI model requires more memory than available. Please try a smaller model or free up system memory."
        );
      }
      if (error.message.includes("Ollama error:")) {
        throw new Error(error.message);
      }
      if (error.message.includes("ECONNREFUSED")) {
        throw new Error(
          "Cannot connect to Ollama. Please ensure Ollama is running on localhost:11434."
        );
      }
    }

    throw new Error(
      "Failed to generate AI response. Please check if Ollama is running and has sufficient memory."
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const {
      message,
      history = [],
      sessionId,
      mode = "chat",
      model = "gpt-6",
    } = body;

    // Get authenticated user
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

    // Validate input
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      // Create a new session if none provided
      const newSession = await db.chatSession.create({
        data: {
          userId: user.id,
          title:
            message.length > 50 ? message.substring(0, 50) + "..." : message,
          isActive: true,
        },
      });
      currentSessionId = newSession.id;
    } else {
      // Verify the session exists and belongs to the user
      const existingSession = await db.chatSession.findFirst({
        where: {
          id: currentSessionId,
          userId: user.id,
        },
      });

      if (!existingSession) {
        return NextResponse.json(
          { error: "Chat session not found" },
          { status: 404 }
        );
      }
    }

    // Save user message to database
    await db.chatMessage.create({
      data: {
        userId: user.id,
        sessionId: currentSessionId,
        role: "user",
        content: message,
        type: mode === "chat" ? "chat" : mode,
      },
    });

    // Validate history format
    const validHistory = Array.isArray(history)
      ? history.filter(
          (msg) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.role === "string" &&
            typeof msg.content === "string" &&
            ["user", "assistant"].includes(msg.role)
        )
      : [];

    const recentHistory = validHistory.slice(-10);

    const messages: ChatMessage[] = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    // Generate AI response
    const aiResponse = await generateAIResponse(messages);

    // Save AI response to database
    const savedMessage = await db.chatMessage.create({
      data: {
        userId: user.id,
        sessionId: currentSessionId,
        role: "assistant",
        content: aiResponse,
        type: mode === "chat" ? "chat" : mode,
        model,
        tokens: Math.floor(aiResponse.length / 4), // Rough estimate
      },
    });

    // Update session timestamp
    await db.chatSession.update({
      where: { id: currentSessionId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      response: aiResponse,
      sessionId: currentSessionId,
      messageId: savedMessage.id,
      timestamp: new Date().toISOString(),
      tokens: savedMessage.tokens,
      model,
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

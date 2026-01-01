import React, { useState, useEffect } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: string;
  tokens?: number;
  model?: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
  _count?: {
    messages: number;
  };
}

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages for a specific session
  const fetchSessionMessages = React.useCallback(
    async (sessionId: string) => {
      try {
        const response = await fetch(`/api/chat/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch session messages");
        }
        const data = await response.json();
        setCurrentMessages(data.session.messages || []);
        setCurrentSession(data.session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [] // Add dependencies here if needed
  );

  // Fetch all sessions
  const fetchSessions = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/chat/sessions");
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      setSessions(data.sessions);

      // Set active session if exists
      const activeSession = data.sessions.find((s: ChatSession) => s.isActive);
      if (activeSession) {
        setCurrentSession(activeSession);
        await fetchSessionMessages(activeSession.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fetchSessionMessages]);

  // Create a new session
  const createSession = async (title?: string) => {
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      const newSession = data.session;
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setCurrentMessages([]);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  // Switch to a different session
  const switchSession = async (sessionId: string) => {
    try {
      // Validate session ID
      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      // Check if session exists in local state
      const sessionExists = sessions.find((s) => s.id === sessionId);
      if (!sessionExists) {
        throw new Error("Session not found");
      }

      console.log(
        `switchSession - Attempting to switch to session: ${sessionId}`
      );

      // Set the session as active
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: true }),
      });

      console.log(
        `switchSession - Response status: ${response.status} for session: ${sessionId}`
      );

      if (!response.ok) {
        // Try to get detailed error information
        let errorMessage = `Failed to update chat session (status ${response.status}) for sessionId: ${sessionId}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const errorData = await response.json();
            console.error("switchSession - Error response (JSON):", errorData);
            if (typeof errorData?.error === "string" && errorData.error.trim()) {
              errorMessage = errorData.error;
            } else if (typeof errorData?.message === "string" && errorData.message.trim()) {
              errorMessage = errorData.message;
            } else {
              errorMessage += ". No error details returned by server.";
            }
          } else {
            const rawText = await response.text();
            console.error("switchSession - Error response (text):", rawText);
            if (rawText && rawText.trim()) errorMessage = rawText;
            else errorMessage += ". No error details returned by server.";
          }
        } catch (err) {
          console.error("switchSession - Failed to parse error response", err);
          errorMessage += ". Additionally, failed to parse error response.";
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("switchSession - Success response:", responseData);

      await fetchSessionMessages(sessionId);

      // Update local sessions list
      setSessions((prev) =>
        prev.map((s) => ({
          ...s,
          isActive: s.id === sessionId,
        }))
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unknown error occurred while switching session";
      console.error("switchSession error:", err);
      setError(errorMessage);
      throw err;
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      // If deleting current session, switch to the most recent one
      if (currentSession?.id === sessionId) {
        const remainingSessions = sessions.filter((s) => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          await switchSession(remainingSessions[0].id);
        } else {
          // Create a new session if no sessions left
          await createSession();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  // Update session title
  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error("Failed to update session title");
      }

      const data = await response.json();
      const updatedSession = data.session;

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updatedSession : s))
      );

      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSession);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  // Add a new message to current session
  const addMessage = (message: Omit<ChatMessage, "id" | "createdAt">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setCurrentMessages((prev) => [...prev, newMessage]);
  };

  // Clear error
  const clearError = () => setError(null);

  // Initialize on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    currentSession,
    currentMessages,
    loading,
    error,
    fetchSessions,
    fetchSessionMessages,
    createSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    addMessage,
    clearError,
  };
};

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Map frontend model names to actual Groq model names
const modelMap: Record<string, string> = {
  "qwen2.5": "llama-3.1-8b-instant", // Fallback to a reliable model
  "Qwen 2.5": "llama-3.1-8b-instant", // Display name fallback
  codellama: "llama-3.1-8b-instant", // Fallback to a reliable model
  llama2: "llama-3.1-8b-instant", // Fallback to a reliable model
  "Llama 3.1 8B Instant": "llama-3.1-8b-instant", // Display name fallback
  "Llama 3.1 70B Versatile": "llama-3.1-8b-instant", // Updated to use working model
  "mixtral-8x7b": "llama-3.1-8b-instant", // Additional model option
  "Mixtral 8x7B": "llama-3.1-8b-instant", // Additional model option
  "gemma-7b-it": "llama-3.1-8b-instant", // Additional model option
  "Gemma 7B IT": "llama-3.1-8b-instant", // Additional model option
  "claude-haiku-4.5": "claude-haiku-4.5", // Enable Claude Haiku 4.5 for all clients
  "Claude Haiku 4.5": "claude-haiku-4.5", // Display name mapping
};

export async function generateGroqResponse(
  messages: ChatMessage[],
  model: string = "llama-3.1-8b-instant",
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<string> {
  // Map the model name to a valid Groq model
  const groqModel = modelMap[model] || model;
  console.log(`Using Groq model: ${groqModel} (requested: ${model})`);

  try {
    const response = await groq.chat.completions.create({
      messages,
      model: groqModel,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq model");
    }

    return content.trim();
  } catch (error) {
    console.error("Groq API error:", error);

    if (error instanceof Error) {
      // Check for specific Groq errors
      if (error.message.includes("API key")) {
        throw new Error(
          "Invalid Groq API key. Please check your GROQ_API_KEY environment variable."
        );
      }
      if (error.message.includes("rate limit")) {
        throw new Error(
          "Groq rate limit exceeded. Please try again in a moment."
        );
      }
      if (error.message.includes("model")) {
        throw new Error(
          "Invalid Groq model specified. Please check the model name."
        );
      }
    }

    throw new Error(
      "Failed to generate AI response using Groq. Please check your API configuration."
    );
  }
}

export async function generateGroqCodeCompletion(
  prompt: string,
  model: string = "llama-3.1-8b-instant",
  temperature: number = 0.7,
  maxTokens: number = 300
): Promise<string> {
  // Map the model name to a valid Groq model
  const groqModel = modelMap[model] || model;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert code completion assistant. Provide only the code that should be inserted at the cursor, maintaining proper indentation and style.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: groqModel,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No code completion from Groq model");
    }

    // Clean up the suggestion
    let suggestion = content.trim();
    if (suggestion.includes("```")) {
      const codeMatch = suggestion.match(/```[\w]*\n?([\s\S]*?)```/);
      suggestion = codeMatch ? codeMatch[1].trim() : suggestion;
    }

    return suggestion;
  } catch (error) {
    console.error("Groq code completion error:", error);
    return "// AI suggestion unavailable";
  }
}

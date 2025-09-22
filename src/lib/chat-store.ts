"use server";
import { Message as AIMsg, generateText } from "ai";
import { generateId } from "ai";
import { openRouterClient, runQuery } from "./clients";
import { generateTitlePrompt } from "./prompts";
import type { RowDataPacket } from 'mysql2';

// Extend the Message type to include duration for database persistence
export type DbMessage = AIMsg & {
  duration?: number;
  model?: string; // which model was used to generate this message
  isAutoErrorResolution?: boolean; // if true then this message is an automatic error resolution prompt
};

type ChatData = {
  messages: DbMessage[];
  fileName: string | null;
  title: string | null;
  csvHeaders: string[] | null; // Re-adding headers
  createdAt?: Date;
};

export async function createChat({
  userQuestion,
  fileName,
  csvHeaders, // Re-adding headers
}: {
  userQuestion: string;
  fileName: string;
  csvHeaders: string[]; // Re-adding headers
}): Promise<string> {
  const id = generateId();

  // Use userQuestion to generate a title for the chat, with a fallback.
  let title = userQuestion.slice(0, 50); // Default title
  try {
    if (process.env.OPENROUTER_API_KEY) {
      const { text: generatedTitle } = await generateText({
        model: openRouterClient.languageModel("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
        prompt: generateTitlePrompt({ userQuestion }), // Pass only userQuestion
        maxTokens: 100,
      });
      title = generatedTitle;
    }
  } catch (error) {
    console.error("Error generating chat title:", error);
    // Fallback to the default title if generation fails
  }

  const initial: ChatData = {
    messages: [],
    fileName,
    title,
    csvHeaders, // Re-adding headers
    createdAt: new Date(),
  };
  try {
    await runQuery("INSERT INTO chats (id, data) VALUES (?, ?)", [
      id,
      JSON.stringify(initial),
    ]);
  } catch (error) {
    console.error("Failed to persist chat to DB; proceeding without DB.", error);
    // Intentionally continue: we will rely on client-side IndexedDB to reconstruct context.
  }
  return id;
}

export async function loadChat(id: string): Promise<ChatData | null> {
  try {
    const [rows] = await runQuery<RowDataPacket[]>("SELECT data FROM chats WHERE id = ?", [id]);
    if ((rows as any[]).length === 0) return null;
    const row = (rows as any[])[0] as { data: string };
    return JSON.parse(row.data) as ChatData;
  } catch (error) {
    console.error("Failed to load chat from DB; returning null.", error);
    return null;
  }
}

export async function saveNewMessage({
  id,
  message,
  chatData,
}: {
  id: string;
  message: DbMessage;
  chatData?: Partial<Pick<ChatData, 'fileName' | 'csvHeaders'>>; // Update partial type
}): Promise<void> {
  try {
    const chat = await loadChat(id);
    if (chat) {
      const updatedMessages = [...(chat.messages || []), message];
      try {
        await runQuery("UPDATE chats SET data = ? WHERE id = ?", [
          JSON.stringify({
            ...chat,
            messages: updatedMessages,
          }),
          id,
        ]);
      } catch (error) {
        console.error("Failed to update chat in DB; skipping persist.", error);
      }
    } else {
      // If chat does not exist, create a new one with this message
      const newChat: ChatData = {
        messages: [message],
        fileName: chatData?.fileName || null,
        title: null,
        csvHeaders: chatData?.csvHeaders || null, // Add to new chat creation
      };
      try {
        await runQuery("INSERT INTO chats (id, data) VALUES (?, ?)", [
          id,
          JSON.stringify(newChat),
        ]);
      } catch (error) {
        console.error("Failed to insert new chat in DB; skipping persist.", error);
      }
    }
  } catch (outerError) {
    console.error("saveNewMessage encountered an error; continuing.", outerError);
  }
}

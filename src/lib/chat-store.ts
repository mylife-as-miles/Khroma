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
  datasetId: string | null;
  fileName: string | null;
  csvHeaders: string[] | null;
  csvRows: { [key: string]: string }[] | null;
  title: string | null; // inferring the title of the chat based on csvHeaders and first user messages
  createdAt?: Date;
  // ...future fields
};

export async function createChat({
  userQuestion,
  csvHeaders,
  csvRows,
  datasetId,
  fileName,
}: {
  userQuestion: string;
  csvHeaders: string[];
  csvRows: { [key: string]: string }[];
  datasetId: string;
  fileName: string;
}): Promise<string> {
  const id = generateId();

  // Use userQuestion to generate a title for the chat, with a fallback.
  let title = userQuestion.slice(0, 50); // Default title
  try {
    if (process.env.OPENROUTER_API_KEY) {
      const { text: generatedTitle } = await generateText({
        model: openRouterClient.languageModel("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
        prompt: generateTitlePrompt({ csvHeaders, userQuestion }),
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
    csvHeaders,
    csvRows,
    datasetId,
    fileName,
    title,
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
  chatData?: Partial<ChatData>;
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
        csvHeaders: chatData?.csvHeaders || null,
        csvRows: chatData?.csvRows || null,
        datasetId: chatData?.datasetId || null,
        fileName: chatData?.fileName || null,
        title: null,
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

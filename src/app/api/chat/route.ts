import { openRouterClient } from "@/lib/clients";
import {
  streamText,
  generateId,
  CoreMessage,
} from "ai";
import { DbMessage, loadChat, saveNewMessage } from "@/lib/chat-store";
import { limitMessages } from "@/lib/limits";
import { generateCodePrompt } from "@/lib/prompts";
import { CHAT_MODELS } from "@/lib/models";
export async function POST(req: Request) {
  const { id, message, model, chatData } = await req.json();

  const errorResolved = req.headers.get("X-Auto-Error-Resolved");

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  try {
    if (!errorResolved) {
      await limitMessages(ip);
    }
  } catch (err) {
    return new Response("Too many messages. Daily limit reached.", {
      status: 429,
    });
  }

  const chat = await loadChat(id);

  const newUserMessage: DbMessage = {
    id: generateId(),
    role: "user",
    content: message,
    createdAt: new Date(),
    isAutoErrorResolution: errorResolved === "true",
  };

  await saveNewMessage({ id, message: newUserMessage, chatData });

  const messagesToSave: DbMessage[] = [
    ...(chat?.messages || []),
    newUserMessage,
  ];

  const coreMessagesForStream = messagesToSave
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  const start = Date.now();

  const defaultModel = CHAT_MODELS.find((m) => m.isDefault)?.model;
  const selectedModelSlug = typeof model === "string" ? model : undefined;
  const selectedModel =
    (selectedModelSlug &&
      CHAT_MODELS.find((m) => m.slug === selectedModelSlug)?.model) ||
    defaultModel;

  if (!selectedModel) {
    throw new Error("Invalid model selected.");
  }

  try {
    const result = await streamText({
      model: openRouterClient.languageModel(selectedModel),
      system: generateCodePrompt({
        csvHeaders: chat?.csvHeaders || [],
        csvRows: chat?.csvRows || [],
      }),
      messages: coreMessagesForStream as CoreMessage[],
      async onFinish({ text }) {
        const end = Date.now();
        const duration = (end - start) / 1000;
        const assistantMessage: DbMessage = {
          id: generateId(),
          role: "assistant",
          content: text,
          createdAt: new Date(),
          duration,
          model: selectedModel,
        };
        await saveNewMessage({ id, message: assistantMessage, chatData });
      },
    });

  // Return Data Stream protocol for compatibility with useChat client parser
  return result.toDataStreamResponse();
  } catch (err) {
    console.error(err);
    return new Response("Error generating response", { status: 500 });
  }
}

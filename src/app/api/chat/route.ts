import { openRouterClient, jina } from "@/lib/clients";
import {
  streamText,
  generateId,
  CoreMessage,
  generateText,
  StreamingTextResponse,
  embed,
} from "ai";
import { DbMessage, loadChat, saveNewMessage } from "@/lib/chat-store";
import { limitMessages } from "@/lib/limits";
import { generateCodePrompt, generateRouterPrompt } from "@/lib/prompts";
import { CHAT_MODELS } from "@/lib/models";
import { search } from "@/lib/search";
import { predictPrice } from "@/lib/bigquery";
import type { ScoredPineconeRecord } from "@pinecone-database/pinecone";

// Helper to format search results into a markdown string
function formatSearchResults(results: ScoredPineconeRecord[]): string {
    if (results.length === 0) {
        return "I couldn't find any products matching your query.";
    }
    return "Here are the top results I found:\n\n" + results.map(r =>
        `### ${r.metadata?.name}\n` +
        `**Category:** ${r.metadata?.category}\n` +
        `**Brand:** ${r.metadata?.brand}\n` +
        `**Price:** $${r.metadata?.price}\n` +
        `**Description:** ${r.metadata?.description}\n` +
        `*(Similarity Score: ${r.score?.toFixed(4)})*`
    ).join('\n\n---\n\n');
}


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
    // 1. Route the user's request
    const routerResult = await generateText({
        model: openRouterClient.languageModel("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
        prompt: generateRouterPrompt({ userQuestion: message }),
    });

    const { intent, parameters } = JSON.parse(routerResult.text);

    // 2. Execute the corresponding tool
    switch (intent) {
        case 'semantic_search': {
            const { embedding } = await embed({
                model: jina('jina-embeddings-v2-base-en'),
                value: parameters.query,
            });
            const results = await search(embedding, 3);
            const responseText = formatSearchResults(results);

            const assistantMessage: DbMessage = {
                id: generateId(),
                role: 'assistant',
                content: responseText,
                createdAt: new Date(),
            };
            await saveNewMessage({ id, message: assistantMessage, chatData });

            const stream = new ReadableStream({ start(c) { c.enqueue(responseText); c.close(); }});
            return new StreamingTextResponse(stream);
        }
        case 'image_search': {
            const { embedding } = await embed({
                model: jina('jina-embeddings-v2-base-en'),
                value: parameters.query,
            });
            const results = await search(embedding, 3);
            const responseText = formatSearchResults(results);

            const assistantMessage: DbMessage = {
                id: generateId(),
                role: 'assistant',
                content: responseText,
                createdAt: new Date(),
            };
            await saveNewMessage({ id, message: assistantMessage, chatData });

            const stream = new ReadableStream({ start(c) { c.enqueue(responseText); c.close(); }});
            return new StreamingTextResponse(stream);
        }
        case 'price_prediction': {
            const responseText = await predictPrice(parameters.query);

            const assistantMessage: DbMessage = {
                id: generateId(),
                role: 'assistant',
                content: responseText,
                createdAt: new Date(),
            };
            await saveNewMessage({ id, message: assistantMessage, chatData });

            const stream = new ReadableStream({ start(c) { c.enqueue(responseText); c.close(); }});
            return new StreamingTextResponse(stream);
        }
        case 'general_question':
        default:
            // Fallback to the original code generation logic
            const result = await streamText({
                model: openRouterClient.languageModel(selectedModel),
                system: generateCodePrompt({
                    csvHeaders: chat?.csvHeaders || [],
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
            return result.toDataStreamResponse();
    }
  } catch (err) {
    console.error(err);
    // A bit more specific error for JSON parsing
    if (err instanceof SyntaxError) {
        return new Response("Error: Could not parse the router's response.", { status: 500 });
    }
    return new Response("Error generating response", { status: 500 });
  }
}

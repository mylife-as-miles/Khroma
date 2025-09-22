import { loadChat } from "@/lib/chat-store";
import { ChatScreen } from "@/components/chat-screen";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/utils";
// Using searchParams (passed by Next.js) to read datasetId fallback from URL

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const chat = await loadChat(id);
  if (!chat) {
    return {
      title: `Chat not found | ${APP_NAME}`,
      description: "No chat found for this ID.",
    };
  }
  return {
    title:
      `${chat.title} | ${APP_NAME}` ||
      `Chat "${
        chat.messages.find((msg) => msg.role === "user")?.content
      }" | ${APP_NAME}`,
    description: chat.csvHeaders
      ? `Chat about CSV columns: ${chat.csvHeaders.join(", ")}`
  : "Chat with your CSV using OpenRouter",
    openGraph: {
  images: ["/og.jpg"],
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id:string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const chat = await loadChat(id);
  // Read datasetId from query string as a fallback to support IndexedDB-only flow
  const sp = await searchParams;
  const datasetIdFromQueryRaw = sp?.["datasetId"]; 
  const datasetIdFromQuery = Array.isArray(datasetIdFromQueryRaw)
    ? datasetIdFromQueryRaw[0]
    : datasetIdFromQueryRaw;

  return (
    <ChatScreen
      id={id}
      initialMessages={chat?.messages}
      uploadedFile={{
        datasetId: chat?.datasetId || datasetIdFromQuery || "",
        name: chat?.fileName || "",
        csvHeaders: chat?.csvHeaders || [],
        csvRows: chat?.csvRows || [],
      }}
    />
  );
}

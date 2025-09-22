import { loadChat } from "@/lib/chat-store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "ids must be an array" },
        { status: 400 }
      );
    }
    const results = await Promise.all(
      ids.map(async (id: string) => {
        const chat = await loadChat(id);
        if (chat && chat.title) {
          return {
            id,
            title: chat.title,
            createdAt: chat.createdAt || new Date(),
          };
        } else if (chat) {
          // fallback: use first user message as title
          const userMsg = chat.messages.find((msg) => msg.role === "user");
          return { id, title: userMsg?.content || id };
        } else {
          return null;
        }
      })
    );

    return NextResponse.json(
      results.filter(Boolean).sort((a, b) => {
        if (!b?.createdAt || !a?.createdAt) return 0;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
    );
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

import { getRemainingMessages } from "@/lib/limits";
import { logger, serializeError } from "../../../lib/logger";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  try {
    const result = await getRemainingMessages(ip);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error('GET /api/limits failed', { error: serializeError(error) });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

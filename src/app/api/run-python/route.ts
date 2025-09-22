import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime for file uploads

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "OPENAI_API_KEY not configured" }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code: string | undefined = body?.code;
    const files: Array<{ name: string; content: string; type?: string }> = body?.files || [];

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Missing 'code' in request body" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    // Build a Python preamble to write provided files to disk before running user code
    let preamble = "";
    if (files.length > 0) {
      preamble += "import base64\nimport os\n\n";
      for (const f of files) {
        // Basic filename sanitization: keep simple names
        const safeName = (f.name || "data.csv").replace(/[^a-zA-Z0-9._-]/g, "_");
        const b64 = Buffer.from(f.content, "utf-8").toString("base64");
        preamble += `# Write provided file: ${safeName}\n`;
        preamble += `with open("${safeName}", "w", encoding="utf-8") as _tmp:\n    _tmp.write(base64.b64decode("${b64}").decode("utf-8"))\n\n`;
      }
    }

    const combinedCode = preamble ? `${preamble}\n${code}` : code;

    const inputItems: any[] = [
      {
        role: "user",
        content: [{ type: "input_text", text: `Run this Python code:\n\n${combinedCode}` }],
      },
    ];

    const response = await client.responses.create({
      model: "o4-mini",
      tools: [{ type: "code_interpreter", container: { type: "auto" } }],
      input: inputItems,
    });

    const outputText = (response as any).output_text || JSON.stringify((response as any).output);

    return NextResponse.json({ status: "success", outputs: [{ type: "text", data: outputText }] });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", outputs: [], error_message: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

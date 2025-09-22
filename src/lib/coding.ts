// Client-side helper that calls our server API to run Python code.
// This avoids exposing OPENAI_API_KEY in the browser and works on Vercel.

export interface RunPythonResult {
  status: "success" | "error";
  outputs: { type: "text"; data: string }[];
  error_message?: string;
}

/**
 * Executes Python code with OpenAI's Responses API & Code Interpreter.
 * Supports uploading files from IndexedDB or <input type="file">.
 *
 * @param code - Python code to execute
 * @param files - Optional list of File/Blob objects
 */
export async function runPython(
  code: string,
  files?: (File | Blob)[]
): Promise<RunPythonResult> {
  try {
    // Prepare file contents to send to server
    let serialized: Array<{ name: string; content: string; type?: string }> = [];
    if (files && files.length > 0) {
      const items = await Promise.all(
        files.map(async (f: any, idx) => {
          const name = (f?.name as string) || `file-${idx}.txt`;
          const type = f?.type || "text/plain";
          const content = await f.text();
          return { name, content, type };
        })
      );
      serialized = items;
    }

    const response = await fetch("/api/run-python", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, files: serialized }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || data?.error_message || `HTTP ${response.status}`);
    }

    return data as RunPythonResult;
  } catch (err: any) {
    return {
      status: "error",
      outputs: [],
      error_message: err.message,
    };
  }
}

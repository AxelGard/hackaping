import { google } from "@ai-sdk/google";
import { jsonSchema, streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system, tools, options } = await req.json();

  // The fileData would now be passed in the request body from the forwarding station
  const fileData = req.headers.get("x-file-data")
    ? JSON.parse(req.headers.get("x-file-data") || "{}")
    : null;

  // Check if visualizations are enabled
  const visualizationsEnabled = options?.visualizationsEnabled || false;

  // Adjust the system prompt based on the visualization flag
  let adjustedSystem = system || "";

  if (visualizationsEnabled) {
    adjustedSystem += `
You can generate Python visualization code for data analysis tasks.
When appropriate, provide matplotlib, seaborn, or plotly code that visualizes data effectively.
Always use proper titles, labels, and formatting for clarity.
`;
  }

  // If file data is present, add it to the system prompt
  if (fileData) {
    adjustedSystem += `
The user has uploaded a file: ${fileData.name} (${fileData.type})
${fileData.preview ? `Preview of the content: ${fileData.preview}` : ""}
${fileData.summary ? `Summary: ${fileData.summary}` : ""}

Please analyze this data and provide insights.
`;
  }

  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    messages,
    system: adjustedSystem,
    tools: Object.fromEntries(
      Object.keys(tools || {}).map((name) => [
        name,
        { ...tools[name], parameters: jsonSchema(tools[name].parameters) },
      ]),
    ),
  });

  return result.toDataStreamResponse();
}

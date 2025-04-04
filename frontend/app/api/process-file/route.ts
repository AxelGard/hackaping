import { NextResponse } from "next/server";
import { processFile } from "@/lib/file-processor";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Process the file
    const result = await processFile(file);

    // Return the processed result
    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully processed ${file.name}`,
    });
  } catch (error: any) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      {
        error: "Error processing file",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Main function to process a file
export async function processFile(file: File): Promise<any> {
  try {
    // Determine file type and route to appropriate processor
    if (file.type.startsWith("image/")) {
      return await processImage(file);
    } else if (file.type === "application/pdf") {
      return await processPDF(file);
    } else if (
      file.type.includes("spreadsheet") ||
      file.type.includes("excel") ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls")
    ) {
      return await processSpreadsheet(file);
    } else {
      // Default to text processing
      return await processTextFile(file);
    }
  } catch (error: any) {
    console.error("Error processing file:", error);
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

// Process image files
async function processImage(file: File): Promise<any> {
  return {
    type: "image",
    name: file.name,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
    format: file.type.split("/")[1],
    summary: "Image processed for visualization and analysis",
  };
}

// Process PDF files
async function processPDF(file: File): Promise<any> {
  return {
    type: "pdf",
    name: file.name,
    size: file.size,
    summary: "PDF document processed - text extraction would happen here",
  };
}

// Process spreadsheets (CSV, Excel)
async function processSpreadsheet(file: File): Promise<any> {
  let content = "";
  let summary = "";

  try {
    // For CSV files, we can extract content directly
    if (file.name.endsWith(".csv")) {
      const text = await file.text();
      const lines = text.split("\n").slice(0, 10); // Get first 10 lines
      content = lines.join("\n");
      summary = `CSV file with data preview: ${lines.length} rows`;
    } else {
      // For Excel files, we'd need a proper library
      content = "Excel data would be extracted here";
      summary = "Excel spreadsheet processed";
    }
  } catch (err) {
    console.error("Error processing spreadsheet:", err);
    content = "Failed to extract spreadsheet data";
    summary = "Error processing spreadsheet";
  }

  return {
    type: "spreadsheet",
    name: file.name,
    size: file.size,
    format: file.name.split(".").pop(),
    preview: content,
    summary,
  };
}

// Process text files
async function processTextFile(file: File): Promise<any> {
  let text = "";

  try {
    text = await file.text();
  } catch (err) {
    console.error("Error reading text file:", err);
    text = "Failed to read file content";
  }

  // Truncate text if it's too long
  const truncatedContent =
    text.length > 5000 ? text.substring(0, 5000) + "..." : text;

  return {
    type: "text",
    name: file.name,
    size: file.size,
    content: truncatedContent,
    summary: `Text file with ${text.length} characters`,
  };
}

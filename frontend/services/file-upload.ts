import { create } from "zustand";

interface FileItem {
  id: string;
  file: File;
  status: "pending" | "processing" | "processed" | "error";
  content?: any; // The processed content
  error?: string;
}

interface FileUploadState {
  files: Record<string, FileItem>;
  addFile: (file: File) => string; // Returns file ID
  startProcessing: (id: string) => void; // Just marks as processing
  completeProcessing: (id: string, content?: any, error?: string) => void; // Completes processing
  getProcessedContent: (id: string) => any;
  removeFile: (id: string) => void;
  getPendingFiles: () => FileItem[];
}

export const useFileUploadStore = create<FileUploadState>((set, get) => ({
  files: {},

  addFile: (file: File) => {
    const id = crypto.randomUUID();
    set((state) => ({
      files: {
        ...state.files,
        [id]: { id, file, status: "pending" },
      },
    }));
    return id;
  },

  startProcessing: (id: string) => {
    const { files } = get();
    const fileItem = files[id];

    if (!fileItem || fileItem.status !== "pending") return;

    set((state) => ({
      files: {
        ...state.files,
        [id]: { ...fileItem, status: "processing" },
      },
    }));
  },

  completeProcessing: (id: string, content?: any, error?: string) => {
    const { files } = get();
    const fileItem = files[id];

    if (!fileItem || fileItem.status !== "processing") return;

    set((state) => ({
      files: {
        ...state.files,
        [id]: {
          ...fileItem,
          status: error ? "error" : "processed",
          content: content || fileItem.content,
          error: error || fileItem.error,
        },
      },
    }));
  },

  getProcessedContent: (id: string) => {
    const fileItem = get().files[id];
    return fileItem?.content;
  },

  removeFile: (id: string) => {
    set((state) => {
      const newFiles = { ...state.files };
      delete newFiles[id];
      return { files: newFiles };
    });
  },

  getPendingFiles: () => {
    return Object.values(get().files).filter(
      (file) => file.status === "pending",
    );
  },
}));

async function processTextFile(file: File) {
  try {
    // Basic text file processing
    const text = await file.text();
    return {
      type: "text",
      content: text.substring(0, 10000) + (text.length > 10000 ? "..." : ""),
      preview: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
      summary: `Text file with ${text.length} characters`,
    };
  } catch (error) {
    console.error("Error processing text file:", error);
    return {
      type: "text",
      error: "Failed to read file content",
      preview: "Error reading file",
      summary: "Error processing text file",
    };
  }
}

async function processSpreadsheetFile(file: File) {
  try {
    if (file.name.endsWith(".csv")) {
      // CSV processing
      const text = await file.text();
      const lines = text.split("\n");
      const headers = lines[0];
      const rowCount = lines.length;
      const columnCount = headers.split(",").length;

      const preview = lines.slice(0, 10).join("\n");

      return {
        type: "spreadsheet",
        format: "csv",
        preview,
        content: text,
        summary: `CSV file with ${rowCount} rows and ${columnCount} columns`,
        sampleCode: generateCodeForCSV(file.name),
      };
    } else {
      // Other spreadsheet formats
      return {
        type: "spreadsheet",
        format: file.name.split(".").pop(),
        preview: "Excel file preview not available",
        summary: "Excel file that needs proper parsing",
      };
    }
  } catch (error) {
    console.error("Error processing spreadsheet:", error);
    return {
      type: "spreadsheet",
      error: "Failed to process spreadsheet",
      preview: "Error reading file",
      summary: "Error processing spreadsheet file",
    };
  }
}

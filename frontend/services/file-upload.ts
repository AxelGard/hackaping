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

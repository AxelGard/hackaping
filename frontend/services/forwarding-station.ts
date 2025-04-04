import { create } from "zustand";

interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  summary?: string;
  preview?: string;
}

interface ForwardingStationState {
  processedFiles: Record<string, FileData>;
  addProcessedFile: (fileData: FileData) => void;
  clearProcessedFiles: () => void;
  getProcessedDataForChat: () => FileData | null;
}

export const useForwardingStation = create<ForwardingStationState>(
  (set, get) => ({
    processedFiles: {},

    addProcessedFile: (fileData) => {
      set((state) => ({
        processedFiles: {
          ...state.processedFiles,
          [fileData.id]: fileData,
        },
      }));
    },

    clearProcessedFiles: () => {
      set({ processedFiles: {} });
    },

    getProcessedDataForChat: () => {
      const files = Object.values(get().processedFiles);
      if (files.length === 0) return null;

      // If only one file, return it
      if (files.length === 1) return files[0];

      // If multiple files, return a summary
      return {
        id: "multi-file",
        name: `${files.length} files`,
        type: "multi-file",
        size: files.reduce((total, file) => total + file.size, 0),
        summary: `Collection of ${files.length} files: ${files.map((f) => f.name).join(", ")}`,
      };
    },
  }),
);

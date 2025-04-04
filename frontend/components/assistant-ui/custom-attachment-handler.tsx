"use client";

import { useEffect } from "react";
import { useFileUploadStore } from "@/services/file-upload";
import { useForwardingStation } from "@/services/forwarding-station";
import { readFileAsText } from "@/services/direct-file-reader";

export const AttachmentHandler = () => {
  const files = useFileUploadStore((state) => state.files);
  const { addProcessedFile } = useForwardingStation();
  const { startProcessing, completeProcessing } = useFileUploadStore();

  // Process any pending files
  useEffect(() => {
    // Find pending files and process them
    Object.values(files).forEach(async (fileItem) => {
      if (fileItem.status === "pending") {
        // Mark as processing
        startProcessing(fileItem.id);

        try {
          // Process file based on type
          let content;
          if (fileItem.file.name.endsWith(".csv")) {
            const text = await readFileAsText(fileItem.file);
            const lines = text.split("\n");
            const headers = lines[0].split(",").map((h) => h.trim());

            content = {
              type: "spreadsheet",
              format: "csv",
              content: text,
              preview: lines.slice(0, 10).join("\n"),
              summary: `CSV with ${lines.length} rows, ${headers.length} columns`,
            };
          } else if (
            fileItem.file.type.includes("text") ||
            fileItem.file.name.endsWith(".txt")
          ) {
            // For text files and CSVs
            const text = await readFileAsText(fileItem.file);
            content = {
              type: "text",
              content: text,
              preview:
                text.substring(0, 500) + (text.length > 500 ? "..." : ""),
              summary: `${fileItem.file.name} - ${text.length} characters`,
            };
          } else if (fileItem.file.type.includes("image")) {
            // For images
            content = {
              type: "image",
              preview: "Image file (preview not available in test plugin)",
              summary: `Image: ${fileItem.file.name}`,
            };
          } else {
            // Default for other files
            content = {
              type: "file",
              preview: `File content for ${fileItem.file.name} (preview not available)`,
              summary: `File: ${fileItem.file.name}, size: ${fileItem.file.size} bytes`,
            };
          }

          // Mark as processed with content
          completeProcessing(fileItem.id, content);
          console.log(`Processed file: ${fileItem.file.name}`);
        } catch (error) {
          console.error("Error processing file:", error);
          completeProcessing(fileItem.id, undefined, "Failed to process file");
        }
      }
    });
  }, [files, startProcessing, completeProcessing]);

  // Add processed files to the forwarding station
  useEffect(() => {
    Object.values(files).forEach((fileItem) => {
      if (fileItem.status === "processed" && fileItem.content) {
        // Add processed file data to forwarding station
        addProcessedFile({
          id: fileItem.id,
          name: fileItem.file.name,
          type: fileItem.file.type,
          size: fileItem.file.size,
          content:
            typeof fileItem.content === "string" ? fileItem.content : undefined,
          summary: fileItem.content.summary,
          preview: fileItem.content.preview,
        });
      }
    });
  }, [files, addProcessedFile]);

  return null; // This is just a logic component, no UI
};

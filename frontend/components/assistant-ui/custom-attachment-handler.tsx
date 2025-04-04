"use client";

import { useEffect } from "react";
import { useFileUploadStore } from "@/services/file-upload";
import { useForwardingStation } from "@/services/forwarding-station";

export const AttachmentHandler = () => {
  const files = useFileUploadStore((state) => state.files);
  const { addProcessedFile } = useForwardingStation();

  // Process any files and add them to the forwarding station
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

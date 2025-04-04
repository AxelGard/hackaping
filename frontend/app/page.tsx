"use client";
import { Thread } from "@/components/assistant-ui/thread";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { VisualizationProvider } from "@/components/contexts/visualization-context";
import { AttachmentHandler } from "@/components/assistant-ui/custom-attachment-handler";

export default function Home() {
  const runtime = useChatRuntime({ api: "/api/chat" });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <VisualizationProvider>
        <main className="h-dvh grid grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
          <ThreadList />
          <Thread />
          <AttachmentHandler /> {/* Make sure this is added */}
        </main>
      </VisualizationProvider>
    </AssistantRuntimeProvider>
  );
}

"use client";

import { useState } from "react";
import { BarChartIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface VisualizationToggleProps {
  className?: string;
  onToggle?: (enabled: boolean) => void;
}

export const VisualizationToggle = ({
  className,
  onToggle,
}: VisualizationToggleProps) => {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (onToggle) onToggle(checked);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Checkbox
        id="visualization-toggle"
        checked={enabled}
        onCheckedChange={handleToggle}
      />
      <Label
        htmlFor="visualization-toggle"
        className="flex items-center gap-1.5 text-sm cursor-pointer"
      >
        <BarChartIcon className="h-4 w-4" />
        <span>Enable visualizations</span>
      </Label>
    </div>
  );
};

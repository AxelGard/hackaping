"use client";

import React, { createContext, useContext, useState } from "react";

interface VisualizationContextType {
  visualizationsEnabled: boolean;
  setVisualizationsEnabled: (enabled: boolean) => void;
}

const VisualizationContext = createContext<
  VisualizationContextType | undefined
>(undefined);

export const VisualizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visualizationsEnabled, setVisualizationsEnabled] = useState(false);

  return (
    <VisualizationContext.Provider
      value={{ visualizationsEnabled, setVisualizationsEnabled }}
    >
      {children}
    </VisualizationContext.Provider>
  );
};

export const useVisualization = () => {
  const context = useContext(VisualizationContext);
  if (context === undefined) {
    throw new Error(
      "useVisualization must be used within a VisualizationProvider",
    );
  }
  return context;
};

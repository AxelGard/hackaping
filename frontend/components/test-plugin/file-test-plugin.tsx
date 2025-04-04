"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFileUploadStore } from "@/services/file-upload";
import { useForwardingStation } from "@/services/forwarding-station";

interface FileVisualizer {
  id: string;
  name: string;
  content: string;
  visualizationCode?: string;
  visualizationResult?: string;
  visualizationError?: string;
}

export const FileTestPlugin: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visualizers, setVisualizers] = useState<FileVisualizer[]>([]);
  const files = useFileUploadStore((state) => state.files);
  const { getProcessedDataForChat } = useForwardingStation();

  // Track the file IDs we've already processed to avoid duplicates
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // Monitor for new files and create visualizers (with duplicate prevention)
  useEffect(() => {
    const newVisualizers: FileVisualizer[] = [];
    let newIds = false;

    Object.values(files).forEach((fileItem) => {
      // Only handle complete files that we haven't processed yet
      if (fileItem.status === "processed" && !processedIds.has(fileItem.id)) {
        // Create a visualizer for each file
        newVisualizers.push({
          id: fileItem.id,
          name: fileItem.file.name,
          content: getFileContent(fileItem),
          visualizationCode: generateVisualizationCode(fileItem),
        });

        // Mark this ID as processed
        newIds = true;
        setProcessedIds((prev) => new Set(prev).add(fileItem.id));
      }
    });

    if (newVisualizers.length > 0) {
      setVisualizers((prev) => [...prev, ...newVisualizers]);
      setIsVisible(true); // Auto-show when new files are added
    }
  }, [files, processedIds]);

  // Clear function that also resets the processed IDs
  const clearAll = useCallback(() => {
    setVisualizers([]);
    setProcessedIds(new Set());
  }, []);

  // Extract content from a file item
  const getFileContent = (fileItem: any): string => {
    if (fileItem.content?.content) {
      return fileItem.content.content;
    }

    if (typeof fileItem.content === "string") {
      return fileItem.content;
    }

    if (fileItem.content?.preview) {
      return fileItem.content.preview;
    }

    return `File content unavailable`;
  };

  // Generate simple visualization code based on file type
  const generateVisualizationCode = (fileItem: any): string | undefined => {
    if (fileItem.file.name.endsWith(".csv")) {
      return `
import pandas as pd
import matplotlib.pyplot as plt

# Read the CSV file
df = pd.read_csv("${fileItem.file.name}")

# Get basic info
print(df.info())
print(df.describe())

# Simple visualization
plt.figure(figsize=(10, 6))
if len(df.columns) > 2:
    df.iloc[:, 1:3].plot()
else:
    df.plot()
plt.title("Data from ${fileItem.file.name}")
plt.xlabel("X")
plt.ylabel("Y")
plt.grid(True)
plt.show()
`;
    }
    return undefined;
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-primary text-primary-foreground p-2 rounded-md shadow-lg"
        >
          Show Test Plugin
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-10 right-10 bottom-10 z-50 bg-background border rounded-lg shadow-xl p-4 overflow-auto w-[600px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">File Test Plugin</h2>
        <button
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {visualizers.length === 0 ? (
        <div className="text-center text-muted-foreground p-8">
          <p>No files uploaded yet.</p>
          <p className="text-sm mt-2">
            Upload a file to see content and visualizations here.
          </p>
        </div>
      ) : (
        visualizers.map((viz) => (
          <FileVisualizer key={viz.id} visualizer={viz} />
        ))
      )}

      <button
        onClick={clearAll}
        className="mt-4 bg-destructive text-destructive-foreground p-2 rounded-md"
      >
        Clear All
      </button>
    </div>
  );
};

const FileVisualizer: React.FC<{ visualizer: FileVisualizer }> = ({
  visualizer,
}) => {
  const [showCode, setShowCode] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState<string | null>(
    null,
  );
  const [visualizationError, setVisualizationError] = useState<string | null>(
    null,
  );

  // Function to run the visualization on CSV data
  const runVisualization = useCallback(async () => {
    if (!visualizer.content || !visualizer.name.endsWith(".csv")) {
      setVisualizationError("Can only visualize CSV files");
      return;
    }

    setIsVisualizing(true);
    setVisualizationError(null);

    try {
      // Parse CSV data
      const lines = visualizer.content.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());

      // Extract numeric columns for visualization
      const data = [];
      for (let i = 1; i < Math.min(lines.length, 500); i++) {
        // Process up to 500 rows for visualization
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, any> = {};

        headers.forEach((header, idx) => {
          const value = values[idx];
          const numValue = parseFloat(value);
          row[header] = isNaN(numValue) ? value : numValue;
        });

        data.push(row);
      }

      // Basic statistics
      const stats: Record<string, any> = {};
      headers.forEach((header) => {
        const values = data
          .map((row) => row[header])
          .filter((v) => typeof v === "number");
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          const mean = sum / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);

          stats[header] = {
            min,
            max,
            mean,
            count: values.length,
          };
        }
      });

      // Identify numeric columns for charting
      const numericColumns = Object.keys(stats);

      // Generate random colors for charts
      const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      };

      // Prepare chart datasets
      const chartData = numericColumns.map((column) => ({
        label: column,
        data: data.slice(0, 100).map((row) => row[column]),
        backgroundColor: getRandomColor() + "80", // Add transparency
        borderColor: getRandomColor(),
        borderWidth: 1,
      }));

      // Generate visualization HTML with charts
      let visualizationHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>CSV Visualization</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            body { font-family: Arial, sans-serif; padding: 15px; margin: 0; }
            .stats-table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            .stats-table th, .stats-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .stats-table tr:nth-child(even) { background-color: #f2f2f2; }
            .stats-table th { padding-top: 12px; padding-bottom: 12px; background-color: #4CAF50; color: white; }
            .chart-container { height: 300px; margin-bottom: 30px; }
            .chart-title { font-weight: bold; margin: 10px 0; }
            .tab-container { margin-bottom: 20px; }
            .tab-buttons { overflow: hidden; border: 1px solid #ccc; background-color: #f1f1f1; }
            .tab-button { background-color: inherit; float: left; border: none; outline: none; cursor: pointer; padding: 14px 16px; }
            .tab-button:hover { background-color: #ddd; }
            .tab-button.active { background-color: #ccc; }
            .tab-content { display: none; padding: 6px 12px; border: 1px solid #ccc; border-top: none; }
            .active-tab { display: block; }
          </style>
        </head>
        <body>
          <h2>CSV Analysis: ${visualizer.name}</h2>
          <p>${lines.length} rows, ${headers.length} columns</p>

          <div class="tab-container">
            <div class="tab-buttons">
              <button class="tab-button active" onclick="openTab(event, 'statistics')">Statistics</button>
              <button class="tab-button" onclick="openTab(event, 'data-preview')">Data Preview</button>
              ${numericColumns.length > 0 ? '<button class="tab-button" onclick="openTab(event, \'charts\')">Charts</button>' : ""}
            </div>

            <div id="statistics" class="tab-content active-tab">
              <h3>Summary Statistics</h3>
              <table class="stats-table">
                <tr>
                  <th>Column</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Mean</th>
                  <th>Count</th>
                </tr>
      `;

      numericColumns.forEach((col) => {
        visualizationHTML += `
          <tr>
            <td>${col}</td>
            <td>${stats[col].min.toFixed(2)}</td>
            <td>${stats[col].max.toFixed(2)}</td>
            <td>${stats[col].mean.toFixed(2)}</td>
            <td>${stats[col].count}</td>
          </tr>
        `;
      });

      visualizationHTML += `
              </table>
            </div>

            <div id="data-preview" class="tab-content">
              <h3>Data Preview</h3>
              <table class="stats-table">
                <tr>
      `;

      // Add headers
      headers.forEach((header) => {
        visualizationHTML += `<th>${header}</th>`;
      });

      visualizationHTML += "</tr>";

      // Add data rows (first 10)
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        visualizationHTML += "<tr>";
        headers.forEach((header) => {
          visualizationHTML += `<td>${data[i][header]}</td>`;
        });
        visualizationHTML += "</tr>";
      }

      visualizationHTML += `
              </table>
            </div>
      `;

      // Add charts if we have numeric columns
      if (numericColumns.length > 0) {
        visualizationHTML += `
            <div id="charts" class="tab-content">
              <h3>Visualizations</h3>
        `;

        // Add bar chart
        visualizationHTML += `
              <div class="chart-title">Bar Chart</div>
              <div class="chart-container">
                <canvas id="barChart"></canvas>
              </div>
        `;

        // Add line chart
        visualizationHTML += `
              <div class="chart-title">Line Chart</div>
              <div class="chart-container">
                <canvas id="lineChart"></canvas>
              </div>
        `;

        // Add scatter plot if we have at least 2 numeric columns
        if (numericColumns.length >= 2) {
          visualizationHTML += `
              <div class="chart-title">Scatter Plot</div>
              <div class="chart-container">
                <canvas id="scatterChart"></canvas>
              </div>
          `;
        }

        visualizationHTML += `
            </div>
        `;
      }

      // Add JavaScript for tab functionality and charts
      visualizationHTML += `
          <script>
            function openTab(evt, tabName) {
              var i, tabContent, tabButtons;

              // Hide all tab content
              tabContent = document.getElementsByClassName("tab-content");
              for (i = 0; i < tabContent.length; i++) {
                tabContent[i].className = tabContent[i].className.replace(" active-tab", "");
              }

              // Deactivate all tab buttons
              tabButtons = document.getElementsByClassName("tab-button");
              for (i = 0; i < tabButtons.length; i++) {
                tabButtons[i].className = tabButtons[i].className.replace(" active", "");
              }

              // Show the selected tab and mark button as active
              document.getElementById(tabName).className += " active-tab";
              evt.currentTarget.className += " active";
            }

            // Chart initialization
            window.onload = function() {
              ${
                numericColumns.length > 0
                  ? `
              const numericColumns = ${JSON.stringify(numericColumns)};
              const chartData = ${JSON.stringify(chartData)};
              const labels = Array.from({length: ${Math.min(data.length, 100)}}, (_, i) => i + 1);

              // Bar Chart
              new Chart(document.getElementById('barChart'), {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: chartData.slice(0, 3) // Limit to 3 columns for readability
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'First 100 Rows'
                    },
                    legend: {
                      position: 'top',
                    }
                  }
                }
              });

              // Line Chart
              new Chart(document.getElementById('lineChart'), {
                type: 'line',
                data: {
                  labels: labels,
                  datasets: chartData.slice(0, 3) // Limit to 3 columns for readability
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Data Trends (First 100 Rows)'
                    },
                  }
                }
              });

              ${
                numericColumns.length >= 2
                  ? `
              // Scatter Plot
              new Chart(document.getElementById('scatterChart'), {
                type: 'scatter',
                data: {
                  datasets: [{
                    label: numericColumns[0] + ' vs ' + numericColumns[1],
                    data: Array.from({length: Math.min(${data.length}, 100)}, (_, i) => ({
                      x: chartData[0].data[i],
                      y: chartData[1].data[i]
                    })),
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: numericColumns[0] + ' vs ' + numericColumns[1]
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: numericColumns[0]
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: numericColumns[1]
                      }
                    }
                  }
                }
              });
              `
                  : ""
              }
              `
                  : ""
              }
            };
          </script>
        </body>
        </html>
      `;

      setVisualizationResult(visualizationHTML);
    } catch (err) {
      console.error("Visualization error:", err);
      setVisualizationError(
        `Failed to visualize data: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsVisualizing(false);
    }
  }, [visualizer]);

  return (
    <div className="mb-6 p-3 border rounded-md">
      <h3 className="font-semibold">{visualizer.name}</h3>

      <div className="flex flex-wrap gap-2 mt-2">
        <button
          onClick={() => setShowContent(!showContent)}
          className="bg-secondary text-secondary-foreground px-3 py-1 text-sm rounded"
        >
          {showContent ? "Hide Content" : "Show Content"}
        </button>

        {visualizer.visualizationCode && (
          <button
            onClick={() => setShowCode(!showCode)}
            className="bg-secondary text-secondary-foreground px-3 py-1 text-sm rounded"
          >
            {showCode ? "Hide Code" : "Show Code"}
          </button>
        )}

        {visualizer.name.endsWith(".csv") && (
          <button
            onClick={runVisualization}
            disabled={isVisualizing}
            className="bg-primary text-primary-foreground px-3 py-1 text-sm rounded"
          >
            {isVisualizing ? "Visualizing..." : "Visualize Data"}
          </button>
        )}
      </div>

      {showContent && (
        <div className="mt-3 p-3 bg-muted rounded-md overflow-auto max-h-[200px]">
          <pre className="text-xs">{visualizer.content}</pre>
        </div>
      )}

      {showCode && visualizer.visualizationCode && (
        <div className="mt-3">
          <div className="bg-black text-white p-3 rounded-md overflow-auto max-h-[300px]">
            <pre className="text-xs">{visualizer.visualizationCode}</pre>
          </div>

          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              This is sample visualization code. Click "Visualize Data" to see
              an interactive visualization.
            </p>
          </div>
        </div>
      )}

      {visualizationError && (
        <div className="mt-3 p-3 bg-destructive/10 text-destructive rounded-md">
          {visualizationError}
        </div>
      )}

      {visualizationResult && (
        <div className="mt-3 border rounded-md">
          <iframe
            srcDoc={visualizationResult}
            title="Visualization"
            className="w-full h-[600px] rounded-md"
            sandbox="allow-scripts"
          />
        </div>
      )}
    </div>
  );
};

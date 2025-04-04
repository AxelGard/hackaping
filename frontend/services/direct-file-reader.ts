export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function getCSVPreview(
  file: File,
  rowLimit = 10,
): Promise<string> {
  const content = await readFileAsText(file);
  const lines = content.split("\n").slice(0, rowLimit);
  return lines.join("\n");
}

export function generateCodeForCSV(filename: string): string {
  return `
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load data
df = pd.read_csv("${filename}")

# Display basic information
print("Data shape:", df.shape)
print("\\nData types:")
print(df.dtypes)
print("\\nSummary statistics:")
print(df.describe())

# Create visualizations
plt.figure(figsize=(12, 8))

# If numeric columns exist, create plots
numeric_cols = df.select_dtypes(include=['number']).columns

if len(numeric_cols) >= 2:
    # Correlation heatmap
    plt.figure(figsize=(10, 8))
    sns.heatmap(df[numeric_cols].corr(), annot=True, cmap='coolwarm', fmt=".2f")
    plt.title('Correlation Heatmap')
    plt.tight_layout()
    plt.show()

    # Scatter matrix
    pd.plotting.scatter_matrix(df[numeric_cols[:4]], figsize=(12, 12),
                              diagonal='kde', alpha=0.6)
    plt.tight_layout()
    plt.show()

    # Distribution of first numeric column
    plt.figure(figsize=(10, 6))
    sns.histplot(df[numeric_cols[0]], kde=True)
    plt.title(f'Distribution of {numeric_cols[0]}')
    plt.tight_layout()
    plt.show()

# Time series if a date column exists
date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
if date_cols and len(numeric_cols) > 0:
    plt.figure(figsize=(12, 6))

    # Try to convert to datetime and plot time series
    try:
        df[date_cols[0]] = pd.to_datetime(df[date_cols[0]])
        df.set_index(date_cols[0])[numeric_cols[0]].plot()
        plt.title(f'{numeric_cols[0]} Over Time')
        plt.grid(True)
        plt.tight_layout()
        plt.show()
    except:
        print("Could not create time series plot")
`;
}

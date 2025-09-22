"use client";

import {
  Code,
  CodeBlock,
  CodeHeader,
} from '@/components/animate-ui/components/animate/code';
import { File } from 'lucide-react';

interface CodeDemoProps {
  duration: number;
  delay: number;
  writing: boolean;
  cursor: boolean;
}

export const CodeDemo = ({
  duration,
  delay,
  writing,
  cursor,
}: CodeDemoProps) => {
  return (
    <Code
      key={`${duration}-${delay}-${writing}-${cursor}`}
      className="w-[520px] h-[420px]"
      code={`import pandas as pd
import matplotlib.pyplot as plt

# Download the CSV file
url = "https://napkinsdev.s3.us-east-1.amazonaws.com/next-s3-uploads/c3952915-ab9f-4def-9bee-2ef8c76d5b7a/products.csv"
df = pd.read_csv(url)

# Group by brand and sum the stock
brand_stock = df.groupby('Brand')['Stock'].sum().sort_values(ascending=False)

# Get the brand with the most stock
top_brand = brand_stock.index[0]
top_stock = brand_stock.iloc[0]

print(f"The brand with the most stock is '{top_brand}' with {top_stock} items in stock.")

# Create a bar chart of the top 10 brands by stock
plt.figure(figsize=(12, 6))
brand_stock.head(10).plot(kind='bar')
plt.title('Top 10 Brands by Total Stock')
plt.xlabel('Brand')
plt.ylabel('Total Stock')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.show()`}
    >
      <CodeHeader icon={File} copyButton>
        analysis.py
      </CodeHeader>

      <CodeBlock
        cursor={cursor}
        lang="python"
        writing={writing}
        duration={duration}
        delay={delay}
      />
    </Code>
  );
};

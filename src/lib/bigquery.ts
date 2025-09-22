import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery();

export async function predictPrice(productDescription: string): Promise<string> {
  const modelPath = 'your-project-id.your-dataset.product_price_predictor';

  if (modelPath.startsWith('your-project-id')) {
    const errorMessage = "BIGQUERY ERROR: Please configure your Google Cloud Project ID, Dataset, and Model Name in `src/lib/bigquery.ts`.";
    console.error(errorMessage);
    return `Price prediction is not configured. ${errorMessage}`;
  }

  // This is a simplified example. A real implementation would need more robust
  // parsing of the user's query to extract structured features.
  // TODO: Replace with your actual Google Cloud project ID, dataset, and model name.
  const query = `
    SELECT
      predicted_price
    FROM
      ML.PREDICT(MODEL \`${modelPath}\`,
        (
          SELECT
            '${productDescription}' AS description,
            'Kitchen Appliances' as category -- Example category, should be extracted
        ))
  `;

  try {
    const [rows] = await bigquery.query({ query });
    if (rows.length === 0 || !rows[0].predicted_price) {
      return "I couldn't predict a price for this item.";
    }
    const price = rows[0].predicted_price;
    return `Based on the provided specifications, the predicted price is around $${Math.round(price)}.`;
  } catch (error: any) {
    console.error('Error querying BigQuery:', error);
    // In a real app, you might want to check for specific BQ errors.
    if (error.message.includes('Not found: Model')) {
        return "The price prediction model is not available. Please contact an administrator.";
    }
    throw new Error('Failed to predict price.');
  }
}

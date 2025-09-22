import { getPineconeIndex } from './pinecone';
import { Pinecone, type ScoredPineconeRecord } from '@pinecone-database/pinecone';

export async function search(
  vector: number[],
  topK: number,
  indexName: string = 'khroma-products'
): Promise<ScoredPineconeRecord[]> {
  try {
    const pineconeIndex = await getPineconeIndex(indexName);
    const result = await pineconeIndex.query({
      vector,
      topK,
      includeMetadata: true,
    });
    return result.matches || [];
  } catch (error) {
    console.error('Error searching Pinecone:', error);
    throw new Error('Failed to perform search.');
  }
}

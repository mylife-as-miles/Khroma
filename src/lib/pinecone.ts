import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

if (!PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not set');
}

const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

export const getPineconeIndex = async (indexName: string, dimension: number = 768) => {
  const indexes = await pinecone.listIndexes();
  if (!indexes.indexes?.some(index => index.name === indexName)) {
    await pinecone.createIndex({
      name: indexName,
      dimension: dimension,
      metric: 'cosine',
    });
  }
  return pinecone.index(indexName);
};

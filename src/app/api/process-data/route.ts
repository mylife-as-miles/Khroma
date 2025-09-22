import { NextResponse } from 'next/server';
import { getPineconeIndex } from '@/lib/pinecone';
import { jina } from '@/lib/clients'; // Only need jina now for embeddings
import { embed } from 'ai';
import Papa from 'papaparse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const csvFile = formData.get('csv') as File | null;
    const imageFiles = formData.getAll('images') as File[];

    if (!csvFile) {
      return NextResponse.json({ success: false, error: 'CSV file is required.' }, { status: 400 });
    }
    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one image file is required.' }, { status: 400 });
    }

    const csvText = await csvFile.text();
    const parsedCsv = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const products = parsedCsv.data as any[];

    if (products.length === 0) {
        return NextResponse.json({ success: false, error: 'CSV contains no data.' }, { status: 400 });
    }

    const productMap = new Map(products.map(p => [p['Internal ID'] || p.Index, p]));
    const vectors = [];
    const jinaEmbeddingModel = jina('jina-embeddings-v2-base-en');

    // Generate and add image embeddings
    for (const imageFile of imageFiles) {
        const productId = imageFile.name.split('.')[0];
        const product = productMap.get(productId);
        if (!product) continue;

        const imageBuffer = await imageFile.arrayBuffer();
        const dataUrl = `data:${imageFile.type};base64,${Buffer.from(imageBuffer).toString('base64')}`;

        const { embedding } = await embed({ model: jinaEmbeddingModel, value: dataUrl });

        vectors.push({
            id: `img-${productId}`, // Image-specific ID
            values: embedding,
            metadata: { type: 'image', ...product },
        });
    }

    // Generate and add text embeddings in batches
    const productChunks = [];
    for (let i = 0; i < products.length; i += 50) {
        productChunks.push(products.slice(i, i + 50));
    }

    for (const chunk of productChunks) {
        const texts = chunk.map(p => `${p.Name || ''}: ${p.Description || ''}`);
        const { embeddings } = await embed({ model: jinaEmbeddingModel, values: texts });

        chunk.forEach((product, i) => {
            const productId = product['Internal ID'] || product.Index;
            vectors.push({
                id: `txt-${productId}`, // Text-specific ID
                values: embeddings[i],
                metadata: { type: 'text', ...product },
            });
        });
    }

    if (vectors.length > 0) {
        // All vectors are now 768 dimensions from Jina
        const pineconeIndex = await getPineconeIndex('khroma-products', 768);
        await pineconeIndex.upsert(vectors);
    }

    return NextResponse.json({
        success: true,
        message: `Successfully processed and indexed ${products.length} products.`,
        headers: parsedCsv.meta.fields,
    });
  } catch (error: any) {
    console.error('Error processing data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

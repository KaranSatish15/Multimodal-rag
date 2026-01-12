import { OpenAIEmbeddings } from '@langchain/openai';
import * as fs from 'fs';
import * as path from 'path';

// Simple in-memory vector store for RAG
interface Document {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export class SimpleVectorStore {
  public documents: Document[] = [];
  private embeddings: OpenAIEmbeddings;

  constructor(embeddings: OpenAIEmbeddings) {
    this.embeddings = embeddings;
    this.loadFromDisk();
  }

  // Cosine similarity
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async addDocument(text: string, metadata?: Record<string, any>): Promise<void> {
    const embedding = await this.embeddings.embedQuery(text);
    const doc: Document = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text,
      embedding,
      metadata,
    };
    this.documents.push(doc);
    this.saveToDisk();
  }

  async addDocuments(texts: string[], metadatas?: Record<string, any>[]): Promise<void> {
    const embeddings = await this.embeddings.embedDocuments(texts);
    texts.forEach((text, i) => {
      const doc: Document = {
        id: Date.now().toString() + i + Math.random().toString(36).substr(2, 9),
        text,
        embedding: embeddings[i],
        metadata: metadatas?.[i],
      };
      this.documents.push(doc);
    });
    this.saveToDisk();
  }

  async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    if (this.documents.length === 0) {
      return [];
    }

    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      const similarities = this.documents.map((doc) => ({
        doc,
        similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
      }));

      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k)
        .map((item) => item.doc);
    } catch (error: any) {
      // If embedding fails (e.g., quota exceeded), return empty array
      console.warn('Embedding query failed:', error.message);
      return [];
    }
  }

  private saveToDisk(): void {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'vectorstore.json');
      fs.writeFileSync(filePath, JSON.stringify(this.documents, null, 2));
    } catch (error) {
      console.error('Error saving vector store:', error);
    }
  }

  private loadFromDisk(): void {
    try {
      const filePath = path.join(process.cwd(), 'data', 'vectorstore.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        this.documents = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading vector store:', error);
    }
  }

  clear(): void {
    this.documents = [];
    this.saveToDisk();
  }
}

let vectorStore: SimpleVectorStore | null = null;

export function getVectorStore(): SimpleVectorStore {
  if (!vectorStore) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    vectorStore = new SimpleVectorStore(embeddings);
  }
  return vectorStore;
}

// Initialize with sample knowledge base
export async function initializeRAG(): Promise<void> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const store = getVectorStore();
  
  // Sample knowledge base - can be expanded
  const sampleDocs = [
    "The chatbot supports multimodal inputs including text and images. Users can upload images to ask questions about them.",
    "RAG (Retrieval-Augmented Generation) enhances responses by retrieving relevant context from a knowledge base before generating answers.",
    "Tool-calling allows the chatbot to perform actions like web searches, fetching data, or generating UI elements dynamically.",
    "The chatbot uses Groq API for fast inference and supports streaming responses for real-time interaction.",
    "Vector embeddings are used to find semantically similar documents in the knowledge base for context retrieval.",
    "The system supports both synchronous and streaming responses, providing flexibility for different use cases.",
  ];

  // Only initialize if store is empty
  if (store.documents.length === 0) {
    try {
      await store.addDocuments(sampleDocs);
    } catch (error: any) {
      // If embeddings fail (e.g., quota exceeded), throw to be handled by caller
      throw new Error(`Failed to initialize RAG: ${error.message}`);
    }
  }
}

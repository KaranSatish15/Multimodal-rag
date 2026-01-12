import { NextRequest } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getVectorStore, initializeRAG } from '@/lib/rag';
import { executeTool, availableTools } from '@/lib/tools';

// Initialize RAG on module load (optional - will fail gracefully if OpenAI quota exceeded)
let ragInitialized = false;
let ragEnabled = true; // Flag to disable RAG if it fails

async function ensureRAGInitialized() {
  if (!ragInitialized) {
    try {
      await initializeRAG();
      ragEnabled = true;
      ragInitialized = true;
    } catch (error: any) {
      console.warn('RAG initialization failed (will continue without RAG):', error.message);
      ragEnabled = false;
      ragInitialized = true; // Mark as initialized to prevent retries
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureRAGInitialized();

    const { messages } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set');
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    let userQuery = '';
    
    if (typeof lastMessage.content === 'string') {
      userQuery = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      const textContent = lastMessage.content.find((c: any) => c.type === 'text');
      userQuery = textContent?.text || '';
    }

    // Retrieve relevant context using RAG (optional - fails gracefully)
    let context = '';
    if (userQuery && ragEnabled) {
      try {
        const vectorStore = getVectorStore();
        const relevantDocs = await vectorStore.similaritySearch(userQuery, 3);
        context = relevantDocs.map((doc) => doc.text).join('\n\n');
      } catch (error: any) {
        console.warn('RAG search failed (continuing without context):', error.message);
        // Continue without RAG context
      }
    }

    // Build system prompt with RAG context (optional)
    const systemPrompt = `You are a helpful AI assistant.${context ? ' You have access to a knowledge base through RAG (Retrieval-Augmented Generation).' : ''}

${context ? `Here is relevant context from the knowledge base:\n${context}\n\n` : ''}

${context ? 'Use this context to provide accurate and helpful responses. If the context doesn\'t contain relevant information, you can use your general knowledge or available tools.' : 'Use your general knowledge and available tools to provide accurate and helpful responses.'}

You can process both text and images. When images are provided, describe what you see and answer questions about them.

Available tools:
- web_search: Search the web for current information
- get_current_date: Get the current date and time
- calculate: Perform mathematical calculations

Use tools when appropriate to provide the most helpful responses.`;

    // Prepare messages for the model (already in correct format from useChat)
    const modelMessages = messages;

    // Create tool definitions for Groq (disabled for now - focusing on core streaming)
    // const tools = { ... };

    // Stream the response
    const result = await streamText({
      model: groq('llama3-70b-8192'), // Using stable Groq model (mixtral-8x7b-32768 was decommissioned)
      system: systemPrompt,
      messages: modelMessages,
      // tools: tools,
    });

    // Log the result structure to diagnose the actual shape
    const resultKeys = Object.getOwnPropertyNames(result);
    const resultProto = Object.getPrototypeOf(result);
    const protoKeys = resultProto ? Object.getOwnPropertyNames(resultProto) : [];
    
    console.log('=== streamText result debug ===');
    console.log('result keys:', resultKeys);
    console.log('result prototype keys:', protoKeys);
    
    // The StreamTextResult has convenience methods to convert to HTTP responses
    // toTextStreamResponse() is the correct method to use
    if (typeof (result as any).toTextStreamResponse === 'function') {
      console.log('✓ Using toTextStreamResponse()');
      return (result as any).toTextStreamResponse();
    }

    // Fallback: try toDataStreamResponse
    if (typeof (result as any).toDataStreamResponse === 'function') {
      console.log('✓ Using toDataStreamResponse()');
      return (result as any).toDataStreamResponse();
    }

    // Fallback: try textStream property  
    if ((result as any).textStream) {
      console.log('✓ Using textStream property');
      return new Response((result as any).textStream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Fallback if the streaming shape is unexpected
    console.error('❌ Could not find any stream method on result');
    console.error('Result type:', result?.constructor?.name);
    console.error('Result keys:', resultKeys);
    return new Response(JSON.stringify({ error: 'Streaming not available from model result', debug: { resultKeys } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

import { NextRequest } from 'next/server';
import { getVectorStore, initializeRAG } from '@/lib/rag';

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

    // Get the last user message and extract text for RAG
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
    const systemPrompt = `You are a helpful AI assistant.${
      context ? ' You have access to a knowledge base through RAG (Retrieval-Augmented Generation).' : ''
    }

${context ? `Here is relevant context from the knowledge base:\n${context}\n\n` : ''}

${
  context
    ? "Use this context to provide accurate and helpful responses. If the context doesn't contain relevant information, you can use your general knowledge."
    : 'Use your general knowledge to provide accurate and helpful responses.'
}

You can process both text and images. When images are provided, describe what you see and answer questions about them.`;

    // Prepare messages for Groq API. Inject the system prompt as the first message.
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // Call Groq chat.completions API directly with a multimodal-capable model
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: groqMessages,
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API error: ${groqResponse.status} ${groqResponse.statusText} - ${errorText}`);
    }

    const data = await groqResponse.json();
    const choice = data?.choices?.[0];
    const content = choice?.message?.content;

    let answer = '';

    if (typeof content === 'string') {
      answer = content;
    } else if (Array.isArray(content)) {
      // For multimodal responses, extract only the text parts
      answer = content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }

    if (!answer) {
      answer = 'I could not generate a response for this query.';
    }

    return new Response(answer, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
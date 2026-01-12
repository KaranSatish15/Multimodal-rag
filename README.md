# Multimodal RAG Chatbot

A sophisticated chatbot application featuring Retrieval-Augmented Generation (RAG), multimodal input support (text and images), and tool-calling capabilities. Built with Next.js, Vercel AI SDK, and Groq API.

## 🚀 Features

- **Multimodal Support**: Process both text-based and image-based queries
- **RAG (Retrieval-Augmented Generation)**: Enhanced contextual understanding using a vector knowledge base
- **Tool-Calling**: Perform actions like web search, calculations, and date/time queries
- **Streaming Responses**: Real-time streaming for interactive conversations
- **Modern UI**: Clean, responsive interface with dark mode support
- **Vercel-Ready**: Optimized for deployment on Vercel

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI SDK**: Vercel AI SDK
- **LLM Provider**: Groq API (Llama 3.1 70B)
- **Embeddings**: OpenAI (for vector embeddings in RAG)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+ installed
- A Groq API key ([Get one here](https://console.groq.com))
- An OpenAI API key for embeddings ([Get one here](https://platform.openai.com/api-keys))

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd multimodal-rag-chatbot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📦 Project Structure

```
multimodal-rag-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API route for chatbot
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main chat interface
│   └── globals.css                # Global styles
├── lib/
│   ├── rag.ts                     # RAG implementation with vector store
│   └── tools.ts                   # Tool definitions and execution
├── data/                          # Vector store data (generated)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── vercel.json                    # Vercel configuration
```

## 🎯 Key Components

### RAG Implementation (`lib/rag.ts`)

- Simple vector store with cosine similarity search
- Uses OpenAI embeddings for document vectorization
- Persists to disk for data persistence
- Initializes with sample knowledge base

### Tool-Calling (`lib/tools.ts`)

Available tools:
- `web_search`: Search the web for current information
- `get_current_date`: Get the current date and time
- `calculate`: Perform mathematical calculations

### API Route (`app/api/chat/route.ts`)

- Handles chat requests with streaming responses
- Integrates RAG for context retrieval
- Supports multimodal inputs (text + images)
- Implements tool-calling with Groq

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables:
   - `GROQ_API_KEY`
   - `OPENAI_API_KEY`
5. Click "Deploy"

### 3. Alternative: Deploy via CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts and add your environment variables when asked.

## 📝 Usage Guide

### Basic Text Queries

Simply type your question in the input field and press Send or Enter.

Example queries:
- "What is RAG?"
- "How does the chatbot work?"
- "What tools are available?"

### Image Queries

1. Click the 📷 icon to upload one or more images
2. Type your question about the image(s)
3. Press Send

The chatbot will analyze the images and respond accordingly.

### Tool-Calling Examples

The chatbot automatically uses tools when appropriate:

- **Date/Time**: "What's the current date?" → Uses `get_current_date`
- **Calculations**: "What's 25 * 47?" → Uses `calculate`
- **Web Search**: "Search for latest AI news" → Uses `web_search` (placeholder implementation)

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key for LLM inference | Yes |
| `OPENAI_API_KEY` | OpenAI API key for embeddings | Yes |

## 📚 Customization

### Adding More Knowledge to RAG

Edit `lib/rag.ts` and modify the `sampleDocs` array in the `initializeRAG` function:

```typescript
const sampleDocs = [
  "Your custom knowledge here",
  "Another piece of information",
  // Add more documents...
];
```

### Adding New Tools

1. Define the tool in `lib/tools.ts`
2. Add execution logic in `executeTool` function
3. Register the tool in `app/api/chat/route.ts`

### Changing the Model

Edit `app/api/chat/route.ts` and change the model name:

```typescript
model: groq('llama-3.1-70b-versatile'), // Change this
```

Available models: `llama-3.1-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`

## 🐛 Troubleshooting

### "GROQ_API_KEY is not set" Error

Make sure you've created `.env.local` with your API keys and restarted the development server.

### Vector Store Not Working

- Ensure `OPENAI_API_KEY` is set correctly
- Check that the `data/` directory is writable
- The vector store initializes automatically on first run

### Images Not Processing

- Ensure images are in a supported format (JPEG, PNG, WebP)
- Check browser console for errors
- Verify base64 encoding is working correctly

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Vercel AI SDK](https://ai-sdk.dev) for the excellent AI SDK
- [Groq](https://groq.com) for fast LLM inference
- [OpenAI](https://openai.com) for embeddings API

## 📧 Support

For issues and questions, please open an issue on the GitHub repository.

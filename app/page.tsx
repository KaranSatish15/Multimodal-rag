"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function Chat() {
  // local messages state used for rendering and sending
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localInput, setLocalInput] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('chat-theme');
    const initial = stored === 'light' || stored === 'dark' ? stored : 'dark';
    setTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('chat-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('chat-theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImages((prev) => [...prev, base64String]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };


  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localInput.trim() && images.length === 0) return;

    // Build the user message and append locally (supporting multimodal content)
    const baseId = Date.now();
    let content: any = localInput;

    if (images.length > 0) {
      const imageParts = images.map((image) => ({
        type: 'image_url',
        image_url: { url: image },
      }));

      const textParts =
        localInput.trim().length > 0
          ? [
              {
                type: 'text',
                text: localInput.trim(),
              },
            ]
          : [];

      content = [...textParts, ...imageParts];
    }

    const userMessage = {
      id: `user-${baseId}`,
      role: 'user',
      content,
    };
    setLocalMessages((prev) => [...prev, userMessage]);

    // Clear input and image UI immediately
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLocalInput('');

    // Prepare payload for API: map messages to plain role/content
    const payloadMessages = [...localMessages, userMessage].map((m) => ({ role: m.role, content: m.content }));

    try {
      setIsLoading(true);
      setError(null);

      console.log('Sending chat request...', { messages: payloadMessages });
      console.log('Request body:', JSON.stringify({ messages: payloadMessages }));
      
      let res;
      try {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: payloadMessages }),
        });
      } catch (fetchErr: any) {
        console.error('Fetch failed at network level:', fetchErr);
        throw new Error(`Network error: ${fetchErr.message || 'Failed to fetch'}`);
      }

      console.log('Response received!');
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      console.log('Response url:', res.url);
      console.log('Response statusText:', res.statusText);

      if (!res.ok) {
        let errorText = '';
        try {
          errorText = await res.text();
        } catch (e) {
          errorText = '(Could not read response body)';
        }
        console.error('API error response:', errorText);
        throw new Error(`API error: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const assistantText = await res.text();
      const assistantId = `assistant-${Date.now()}`;
      setLocalMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: assistantText }]);
    } catch (err: any) {
      console.error('Send failed:', err);
      console.error('Error stack:', err.stack);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/70 dark:border-slate-800/70 shadow-sm backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🤖</span>
              <span>FUSION AI</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Powered by Groq AI • RAG • Tool-Calling • Image Support
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-full border border-slate-300/70 dark:border-slate-600 bg-white/80 dark:bg-slate-800 px-3 py-1 text-xs font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="hidden sm:inline">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
              <p className="font-semibold">Error:</p>
              <p>{error.message || 'An error occurred. Please check your API keys and try again.'}</p>
            </div>
          )}
          
          {localMessages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <svg
                  className="w-12 h-12 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to the Multimodal RAG Chatbot
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Ask me anything! I can process text and images, use RAG for context-aware responses,
                and call tools when needed.
              </p>
            </div>
          )}

          {localMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <span className="text-xs opacity-70">Assistant</span>
                  </div>
                )}
                {message.role === 'user' && Array.isArray(message.content) && message.content.some((c: any) => c.type === 'image_url') && (
                  <div className="mb-2 space-y-2">
                    {message.content
                      .filter((c: any) => c.type === 'image_url')
                      .map((item: any, idx: number) => (
                        <Image
                          key={idx}
                          src={item.image_url?.url || ''}
                          alt="Uploaded image"
                          width={200}
                          height={200}
                          className="rounded-lg max-w-full h-auto"
                        />
                      ))}
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {typeof message.content === 'string'
                    ? message.content
                    : Array.isArray(message.content)
                    ? message.content
                        .filter((c: any) => c.type === 'text')
                        .map((c: any) => c.text)
                        .join('')
                    : ''}
                </div>
                {message.toolInvocations?.map((toolInvocation: any) => (
                  <div
                    key={toolInvocation.toolCallId}
                    className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                  >
                    <div className="font-semibold">🔧 {toolInvocation.toolName}</div>
                    <div className="mt-1 opacity-75">
                      {JSON.stringify(toolInvocation.state, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <Image
                    src={image}
                    alt={`Preview ${index + 1}`}
                    width={100}
                    height={100}
                    className="rounded-lg object-cover border-2 border-blue-500"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
              title="Upload images"
            >
              📷
            </label>
            <input
              value={localInput}
              onChange={(e) => {
                setLocalInput(e.target.value);
              }}
              placeholder="Type your message... (supports images and tool-calling)"
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!localInput.trim() && images.length === 0)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Send
            </button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            💡 Tip: Upload images or ask questions that might benefit from web search, calculations, or current date
          </p>
        </div>
      </div>
    </div>
  );
}

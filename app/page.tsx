"use client";

import { useRef, useState } from 'react';
import Image from 'next/image';

export default function Chat() {
  // local messages state used for rendering and sending
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localInput, setLocalInput] = useState<string>('');

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

    // Build the user message and append locally
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: localInput,
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

      if (!res.body) {
        throw new Error('Response has no body stream');
      }

      // Add an empty assistant message that we'll populate as we stream
      const assistantId = `assistant-${Date.now()}`;
      setLocalMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantText = '';

      while (!done) {
        const { value, done: d } = await reader.read();
        done = !!d;
        if (value) {
          const decoded = decoder.decode(value, { stream: true });
          console.log('Decoded chunk:', decoded.substring(0, 100));
          assistantText += decoded;
          // update last assistant message content
          setLocalMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m)));
        }
      }
    } catch (err: any) {
      console.error('Send failed:', err);
      console.error('Error stack:', err.stack);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🤖 Multimodal RAG Chatbot
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Powered by Groq AI • RAG • Tool-Calling • Image Support
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50 dark:bg-gray-900">
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
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
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
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
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
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!localInput.trim() && images.length === 0)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

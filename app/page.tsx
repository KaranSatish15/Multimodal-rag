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
    const payloadMessages = [...localMessages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

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
      setLocalMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: assistantText },
      ]);
    } catch (err: any) {
      console.error('Send failed:', err);
      console.error('Error stack:', err.stack);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 transition-colors duration-300 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(139,92,246,0.18),_transparent_55%)]">
      {/* Header */}
      <header className="border-b border-neutral-200/70 dark:border-neutral-800/70 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 via-sky-400 to-violet-500 p-[1px] shadow-[0_0_12px_rgba(56,189,248,0.55)]">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-neutral-950 text-[0.6rem] font-semibold tracking-[0.08em] text-white dark:bg-neutral-50 dark:text-neutral-900">
                  FA
                </span>
              </span>
              <span>FUSION AI</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Multimodal assistant with RAG, vision and tools
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-full border border-slate-300/70 dark:border-slate-600 bg-white/80 dark:bg-slate-800 px-3 py-1 text-xs font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="hidden sm:inline">
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4 text-sm">
              <p className="font-semibold">Error</p>
              <p>{error.message || 'An error occurred. Please check your API keys and try again.'}</p>
            </div>
          )}

          {localMessages.length === 0 && (
            <div className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
              <p className="mb-1">Start a conversation with Fusion AI.</p>
              <p>Ask a question, paste some text, or upload an image to analyze.</p>
            </div>
          )}

          {localMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-500 text-white dark:from-cyan-400 dark:via-sky-400 dark:to-violet-500'
                    : 'bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-neutral-50 border border-neutral-200/80 dark:border-neutral-800/80'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="text-lg">🤖</span>
                    <span>Assistant</span>
                  </div>
                )}
                {message.role === 'user' &&
                  Array.isArray(message.content) &&
                  message.content.some((c: any) => c.type === 'image_url') && (
                    <div className="mb-2 space-y-2">
                      {message.content
                        .filter((c: any) => c.type === 'image_url')
                        .map((item: any, idx: number) => (
                          <Image
                            key={idx}
                            src={item.image_url?.url || ''}
                            alt="Uploaded image"
                            width={240}
                            height={240}
                            className="rounded-xl max-w-full h-auto border border-neutral-200 dark:border-neutral-800"
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
              <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></div>
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
                    className="rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
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
      <div className="bg-neutral-50/90 dark:bg-neutral-950/90 border-t border-neutral-200 dark:border-neutral-900">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 shadow-sm"
          >
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
              className="flex items-center justify-center px-3 py-2 rounded-xl cursor-pointer text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              title="Upload images"
            >
              📷
            </label>
            <input
              value={localInput}
              onChange={(e) => {
                setLocalInput(e.target.value);
              }}
              placeholder="Ask anything..."
              className="flex-1 px-2 py-1 border-none bg-transparent focus:outline-none focus:ring-0 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!localInput.trim() && images.length === 0)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-violet-500 text-white px-3 py-1.5 text-sm font-medium shadow-[0_0_12px_rgba(56,189,248,0.55)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:from-cyan-400 hover:via-sky-400 hover:to-violet-400"
            >
              Send
            </button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            💡 Tip: Upload images or ask questions that might benefit from web search, calculations, or
            current date
          </p>
        </div>
      </div>
    </div>
  );
}
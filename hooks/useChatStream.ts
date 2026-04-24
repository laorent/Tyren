'use client';

// ============================================================
// useChatStream — Hook for streaming chat with the Gemini API
// Encapsulates: sending messages, SSE stream parsing, abort,
// and error handling. Fully extracted from ChatInterface.tsx.
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { Message, SSEEvent } from '@/lib/types';
import { getAuthToken, resetAuthSession } from '@/lib/auth';

const UPDATE_INTERVAL_MS = 50;
const MAX_HISTORY_MESSAGES = 12;

interface UseChatStreamOptions {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    searchEnabled: boolean;
    thinkingEnabled: boolean;
}

export function useChatStream({ messages, setMessages, searchEnabled, thinkingEnabled }: UseChatStreamOptions) {
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isSendingRef = useRef(false);

    const sendMessage = useCallback(async (content: string, images: string[]) => {
        if (!content.trim() && images.length === 0) return;
        if (isSendingRef.current) return; // Re-entrancy guard

        isSendingRef.current = true;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            images,
            timestamp: Date.now(),
        };

        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
        };

        // Optimistically add both messages
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setIsLoading(true);

        try {
            abortControllerRef.current = new AbortController();
            const authToken = getAuthToken();

            if (!authToken) {
                resetAuthSession();
                return;
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage]
                        .slice(-MAX_HISTORY_MESSAGES)
                        .map((msg) => ({
                            role: msg.role,
                            content: msg.content,
                            images: msg.images,
                        })),
                    searchEnabled,
                    thinkingEnabled,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    const text = await response.clone().text().catch(() => '');
                    if (text === 'Unauthorized') {
                        resetAuthSession();
                        return;
                    }
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `请求失败 (${response.status})`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('No response body');

            let accumulatedContent = '';
            let accumulatedThought = '';
            let lastUpdateTime = 0;
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let hasUpdates = false;

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (!line.startsWith('data: ')) continue;

                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed: SSEEvent = JSON.parse(data);

                        if ('error' in parsed) {
                            throw new Error(parsed.error);
                        }
                        if ('grounding' in parsed) {
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMessageId
                                    ? { ...msg, grounding: parsed.grounding }
                                    : msg
                            ));
                        }
                        if ('thought' in parsed) {
                            accumulatedThought += parsed.thought;
                            hasUpdates = true;
                        }
                        if ('content' in parsed) {
                            accumulatedContent += parsed.content;
                            hasUpdates = true;
                        }
                    } catch (e) {
                        // If it's our own thrown error (from parsed.error), re-throw
                        if (e instanceof Error && !data.startsWith('{')) {
                            console.warn('[Stream] JSON parse error on line:', line);
                        } else {
                            throw e;
                        }
                    }
                }

                if (hasUpdates) {
                    const now = Date.now();
                    if (now - lastUpdateTime > UPDATE_INTERVAL_MS) {
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === assistantMessageId
                                    ? { ...msg, content: accumulatedContent, thought: accumulatedThought }
                                    : msg
                            )
                        );
                        lastUpdateTime = now;
                    }
                }
            }

            // Process remaining buffer
            if (buffer && buffer.trim()) {
                const remainingLines = buffer.split('\n');
                for (const line of remainingLines) {
                    if (line.trim() === '' || !line.startsWith('data: ')) continue;
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed: SSEEvent = JSON.parse(data);
                        if ('grounding' in parsed) {
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMessageId
                                    ? { ...msg, grounding: parsed.grounding }
                                    : msg
                            ));
                        }
                        if ('thought' in parsed) accumulatedThought += parsed.thought;
                        if ('content' in parsed) accumulatedContent += parsed.content;
                    } catch (e) {
                        console.warn('[Stream] Final buffer parse error:', e);
                    }
                }
            }

            // Final sync
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent, thought: accumulatedThought }
                        : msg
                )
            );
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('[Stream] Request aborted');
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('[Stream] Error:', errorMessage);
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: `⚠️ 出错了：${errorMessage}` }
                            : msg
                    )
                );
            }
        } finally {
            setIsLoading(false);
            isSendingRef.current = false;
            abortControllerRef.current = null;
        }
    }, [messages, setMessages, searchEnabled, thinkingEnabled]);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        sendMessage,
        stopGeneration,
    };
}

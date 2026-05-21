'use client';

// ============================================================
// useChatStream — Hook for streaming chat with the Gemini API
// Encapsulates: sending messages, SSE stream parsing, abort,
// and error handling. Fully extracted from ChatInterface.tsx.
// ============================================================

import { startTransition, useState, useRef, useCallback } from 'react';
import { Message, SSEEvent } from '@/lib/types';
import { getAuthToken, resetAuthSession } from '@/lib/auth';

const UPDATE_INTERVAL_MS = 120;
const MIN_CHARS_PER_FLUSH = 24;
const MAX_HISTORY_MESSAGES = 12;

async function readFriendlyResponseError(response: Response): Promise<string> {
    const errorData = await response.json().catch(() => null);
    if (errorData && typeof errorData.error === 'string' && errorData.error.trim()) {
        return errorData.error;
    }

    switch (response.status) {
        case 400:
            return '请求格式不正确，或模型无法接受当前内容。请缩短输入、减少图片，或关闭联网/思考模式后再试。';
        case 401:
            return '登录状态已失效，请重新登录后再试。';
        case 404:
            return '未找到当前配置的模型，请检查模型名称是否正确。';
        case 413:
            return '请求内容太大。请减少图片数量、降低图片尺寸，或缩短本次对话内容后再试。';
        case 429:
            return '模型服务触发限流或配额已用完。请稍后再试，或检查当前 API 配额。';
        case 500:
            return '服务器处理请求时出现异常。请稍后重试；如果持续出现，请查看服务端日志。';
        case 503:
            return '模型服务暂时不可用，可能是上游拥塞或网络波动。请稍后重试。';
        default:
            return `请求失败，服务器返回状态码 ${response.status}。请稍后重试。`;
    }
}

function normalizeDisplayError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
        return '网络连接失败。请检查网络连接，或稍后重试。';
    }

    if (lower.includes('aborted')) {
        return '请求已停止。';
    }

    return message;
}

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

    const streamAssistantResponse = useCallback(async (requestMessages: Message[], assistantMessageId: string) => {
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
                    messages: requestMessages
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
                throw new Error(await readFriendlyResponseError(response));
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('No response body');

            let accumulatedContent = '';
            let accumulatedThought = '';
            let lastUpdateTime = 0;
            let lastFlushedContentLength = 0;
            let lastFlushedThoughtLength = 0;
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
                            startTransition(() => {
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, grounding: parsed.grounding }
                                        : msg
                                ));
                            });
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
                    const elapsed = now - lastUpdateTime;
                    const contentDelta = accumulatedContent.length - lastFlushedContentLength;
                    const thoughtDelta = accumulatedThought.length - lastFlushedThoughtLength;
                    if (elapsed > UPDATE_INTERVAL_MS || contentDelta >= MIN_CHARS_PER_FLUSH || thoughtDelta >= MIN_CHARS_PER_FLUSH) {
                        startTransition(() => {
                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, content: accumulatedContent, thought: accumulatedThought }
                                        : msg
                                )
                            );
                        });
                        lastUpdateTime = now;
                        lastFlushedContentLength = accumulatedContent.length;
                        lastFlushedThoughtLength = accumulatedThought.length;
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
                            startTransition(() => {
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, grounding: parsed.grounding }
                                        : msg
                                ));
                            });
                        }
                        if ('thought' in parsed) accumulatedThought += parsed.thought;
                        if ('content' in parsed) accumulatedContent += parsed.content;
                    } catch (e) {
                        console.warn('[Stream] Final buffer parse error:', e);
                    }
                }
            }

            // Final sync
            startTransition(() => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: accumulatedContent, thought: accumulatedThought }
                            : msg
                    )
                );
            });
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('[Stream] Request aborted');
            } else {
                const errorMessage = normalizeDisplayError(error);
                console.error('[Stream] Error:', errorMessage);
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: `⚠️ 故障：${errorMessage}` }
                            : msg
                    )
                );
            }
        } finally {
            setIsLoading(false);
            isSendingRef.current = false;
            abortControllerRef.current = null;
        }
    }, [setMessages, searchEnabled, thinkingEnabled]);

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

        await streamAssistantResponse([...messages, userMessage], assistantMessageId);
    }, [messages, setMessages, streamAssistantResponse]);

    const regenerateLastResponse = useCallback(async () => {
        if (isSendingRef.current) return;

        const assistantIndex = messages.length - 1;
        const assistantMessage = messages[assistantIndex];
        const previousUserMessage = messages[assistantIndex - 1];

        if (
            !assistantMessage ||
            assistantMessage.role !== 'assistant' ||
            !previousUserMessage ||
            previousUserMessage.role !== 'user'
        ) {
            return;
        }

        isSendingRef.current = true;
        const assistantMessageId = assistantMessage.id;
        const requestMessages = messages.slice(0, assistantIndex);

        setMessages(prev =>
            prev.map(msg =>
                msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: '',
                        thought: undefined,
                        grounding: undefined,
                        timestamp: Date.now(),
                    }
                    : msg
            )
        );
        setIsLoading(true);

        await streamAssistantResponse(requestMessages, assistantMessageId);
    }, [messages, setMessages, streamAssistantResponse]);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        sendMessage,
        regenerateLastResponse,
        stopGeneration,
    };
}

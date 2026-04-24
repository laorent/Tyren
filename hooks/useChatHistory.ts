'use client';

// ============================================================
// useChatHistory — Hook for async chat history persistence
// Uses IndexedDB via lib/storage.ts. Debounces saves to avoid
// thrashing during streaming. Handles load, save, and clear.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/lib/types';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '@/lib/storage';

const SAVE_DEBOUNCE_MS = 800;

export function useChatHistory() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ---- Load from IndexedDB on mount ----
    useEffect(() => {
        let cancelled = false;

        loadChatHistory()
            .then((loaded) => {
                if (!cancelled && loaded.length > 0) {
                    setMessages(loaded);
                }
            })
            .catch((e) => {
                console.error('[useChatHistory] Failed to load history:', e);
            })
            .finally(() => {
                if (!cancelled) setIsHistoryLoaded(true);
            });

        return () => { cancelled = true; };
    }, []);

    // ---- Debounced save to IndexedDB whenever messages change ----
    useEffect(() => {
        // Don't save until the initial load is complete to avoid overwriting
        if (!isHistoryLoaded) return;

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(() => {
            if (messages.length > 0) {
                saveChatHistory(messages).catch((e) => {
                    console.warn('[useChatHistory] Failed to save:', e);
                });
            } else {
                clearChatHistory().catch((e) => {
                    console.warn('[useChatHistory] Failed to clear:', e);
                });
            }
        }, SAVE_DEBOUNCE_MS);

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [messages, isHistoryLoaded]);

    // ---- Public API ----
    const clearMessages = useCallback(() => {
        setMessages([]);
        clearChatHistory().catch((e) => {
            console.warn('[useChatHistory] Failed to clear on user action:', e);
        });
    }, []);

    return {
        messages,
        setMessages,
        clearMessages,
        isHistoryLoaded,
    };
}

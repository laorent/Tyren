'use client'

import { useState } from 'react'
import styles from './ChatInterface.module.css'
import MessageList from '@/components/MessageList'
import InputArea from '@/components/InputArea'
import ThemeToggle from '@/components/ThemeToggle'
import { useChatHistory } from '@/hooks/useChatHistory'
import { useChatStream } from '@/hooks/useChatStream'

export default function ChatInterface() {
    const [searchEnabled, setSearchEnabled] = useState(() => {
        if (typeof window === 'undefined') return false
        return localStorage.getItem('tyren_search_enabled') === 'true'
    })
    const [isThinkingMode, setIsThinkingMode] = useState(() => {
        if (typeof window === 'undefined') return false
        return localStorage.getItem('tyren_thinking_enabled') === 'true'
    })
    const [inputValue, setInputValue] = useState('')

    const { messages, setMessages, clearMessages } = useChatHistory()
    const { isLoading, sendMessage, stopGeneration } = useChatStream({
        messages,
        setMessages,
        searchEnabled,
        thinkingEnabled: isThinkingMode,
    })

    const handleClearChat = () => {
        if (confirm('确定要清除当前对话记录吗？')) {
            clearMessages()
        }
    }

    const handleSelectSuggestion = (text: string) => {
        setInputValue(text)
        setTimeout(() => setInputValue(''), 100)
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.logoSection}>
                        <div className={styles.logoIcon}>
                            <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="grad-top" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00f2fe" />
                                        <stop offset="100%" stopColor="#4facfe" />
                                    </linearGradient>
                                    <linearGradient id="grad-left" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#764ba2" />
                                        <stop offset="100%" stopColor="#667eea" />
                                    </linearGradient>
                                    <linearGradient id="grad-right" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#66a6ff" />
                                        <stop offset="100%" stopColor="#89f7fe" />
                                    </linearGradient>
                                    <linearGradient id="grad-node" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="100%" stopColor="#e0eaff" />
                                    </linearGradient>
                                    <filter id="cube-shadow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="0" dy="16" stdDeviation="24" floodColor="#764ba2" floodOpacity="0.25" />
                                    </filter>
                                </defs>
                                <g transform="translate(0, -8)" filter="url(#cube-shadow)">
                                    <path d="M256 120 L384 194 L256 268 L128 194 Z" fill="url(#grad-top)" />
                                    <path d="M128 194 L128 342 L256 416 L256 268 Z" fill="url(#grad-left)" />
                                    <path d="M384 194 L384 342 L256 416 L256 268 Z" fill="url(#grad-right)" />
                                    <g stroke="#ffffff" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" fill="none">
                                        <path d="M256 120 L384 194 L384 342 L256 416 L128 342 L128 194 Z" />
                                        <path d="M128 194 L256 268 L384 194" />
                                        <path d="M256 268 L256 416" />
                                    </g>
                                    <g fill="url(#grad-node)" stroke="#ffffff" strokeWidth="4">
                                        <circle cx="256" cy="120" r="14" />
                                        <circle cx="128" cy="194" r="14" />
                                        <circle cx="384" cy="194" r="14" />
                                        <circle cx="128" cy="342" r="14" />
                                        <circle cx="384" cy="342" r="14" />
                                        <circle cx="256" cy="416" r="14" />
                                    </g>
                                    <circle cx="256" cy="268" r="42" fill="#FFFFFF" opacity="0.3" />
                                    <circle cx="256" cy="268" r="26" fill="#FFFFFF" />
                                </g>
                            </svg>
                        </div>
                        <h1 className={styles.title}>Tyren</h1>
                    </div>

                    <div className={styles.controls}>
                        <button
                            className={`${styles.controlButton} ${isThinkingMode ? styles.active : ''}`}
                            onClick={() => {
                                const newState = !isThinkingMode
                                setIsThinkingMode(newState)
                                localStorage.setItem('tyren_thinking_enabled', String(newState))
                            }}
                            title={isThinkingMode ? '关闭深度思考' : '开启深度思考'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M9 12h6m-3-3v6" transform="rotate(45 12 12)" />
                                <path d="M12 3v2m0 14v2M3 12h2m14 0h2" opacity="0.5" />
                            </svg>
                        </button>

                        <button
                            className={`${styles.controlButton} ${searchEnabled ? styles.active : ''}`}
                            onClick={() => {
                                const newState = !searchEnabled
                                setSearchEnabled(newState)
                                localStorage.setItem('tyren_search_enabled', String(newState))
                            }}
                            title={searchEnabled ? '关闭联网搜索' : '开启联网搜索'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                        </button>

                        <button className={styles.controlButton} onClick={handleClearChat} title="清除对话">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </button>

                        <div className={styles.themeToggleWrapper}>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    onSelectSuggestion={handleSelectSuggestion}
                />
            </main>

            <footer className={styles.footer}>
                <InputArea
                    onSend={sendMessage}
                    disabled={isLoading}
                    onStop={stopGeneration}
                    externalContent={inputValue}
                />
            </footer>
        </div>
    )
}

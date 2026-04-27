'use client'

import { useDeferredValue, useEffect, useRef, useState, memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { PluggableList } from 'unified'
import 'katex/dist/katex.min.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Message, GroundingChunk, CodeComponentProps } from '@/lib/types'
import ErrorBoundary from './ErrorBoundary'
import styles from './MessageList.module.css'

interface MessageListProps {
    messages: Message[]
    isLoading: boolean
    onSelectSuggestion: (text: string) => void
}

const ALL_QUESTIONS = [
    '解释一下广义相对论的核心概念。',
    '什么是量子纠缠？它和量子叠加有什么区别？',
    '黑洞是如何形成的？最终会消失吗？',
    'DNA 如何存储遗传信息？',
    '工业革命是怎样改变社会结构的？',
    '文艺复兴对现代西方文明有哪些深远影响？',
    '什么是存在主义？可以用萨特举例说明吗？',
    '博弈论中的囚徒困境说明了什么？',
    '解释一下确认偏误如何影响人的判断。',
    '什么是奥卡姆剃刀？它在科学研究中如何使用？',
    '哥德尔不完备定理为什么重要？',
    '欧拉公式 e^(iπ) + 1 = 0 为什么被称为优美？',
    '香农信息论对现代通信有哪些影响？',
    '大模型是如何处理语言的？',
    '什么是数字孪生技术？',
    '区块链去中心化的核心机制是什么？',
    '请解释一下控制论的基本思想。',
    '什么是热力学第二定律？为什么和时间方向有关？',
    '请介绍一下日本明治维新的社会影响。',
    '什么是文化相对主义？'
]

function CodeBlock({ language, value, isStreaming }: { language: string, value: string, isStreaming: boolean }) {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadCode = () => {
        const blob = new Blob([value], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `snippet-${Date.now()}.${language || 'txt'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className={styles.codeBlockContainer}>
            <div className={styles.codeBlockHeader}>
                <span className={styles.codeLanguage}>{language || 'text'}</span>
                <div className={styles.codeActions}>
                    <button onClick={downloadCode} className={styles.actionIconButton} title="下载代码">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className={`${styles.actionIconButton} ${copied ? styles.copied : ''}`}
                        title="复制代码"
                    >
                        {copied ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            <div className={styles.pre}>
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={prism}
                    showLineNumbers={!isStreaming}
                    customStyle={{ margin: 0, background: '#ffffff', padding: '16px 0', fontSize: '14px', borderRadius: '0 0 8px 8px' }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    )
}

const ThoughtBlock = ({ thought, isStreaming }: { thought: string, isStreaming: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    if (!thought) return null

    return (
        <div className={styles.thoughtSection}>
            <button className={styles.thoughtHeader} onClick={() => setIsExpanded(!isExpanded)}>
                <div className={styles.thoughtTitle}>
                    <svg className={isStreaming ? styles.spin : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <span>{isStreaming ? '正在思考中...' : '查看思考过程'}</span>
                </div>
                <svg className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {isExpanded && (
                <div className={styles.thoughtContent}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{thought}</ReactMarkdown>
                </div>
            )}
        </div>
    )
}

const MessageItem = memo(({ message, isLoading }: { message: Message, isLoading: boolean }) => {
    const processedContent = useMemo(() => {
        if (message.role !== 'assistant' || !message.content) return message.content || ''
        return message.content
            .replace(/\*\*\s*([^*]+?)\s*\*\*/g, '**$1**')
            .replace(/\*\*(["'“‘「『]+)/g, '$1**')
            .replace(/(["'”’」』]+)\*\*/g, '**$1')
            .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
            .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
    }, [message.content, message.role])
    const deferredContent = useDeferredValue(processedContent)
    const stableRenderContent = isLoading ? deferredContent : processedContent
    const remarkPlugins = useMemo<PluggableList>(() => [remarkGfm, remarkMath], [])
    const rehypePlugins = useMemo<PluggableList>(() => [[rehypeKatex, { strict: false, throwOnError: false }]], [])

    const searchQueries = message.grounding?.webSearchQueries?.filter(Boolean) ?? []

    return (
        <div className={`${styles.messageWrapper} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
            <div className={styles.messageContent}>
                <div className={styles.messageAvatar}>
                    {message.role === 'user' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id={`grad-top-${message.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#00f2fe" />
                                    <stop offset="100%" stopColor="#4facfe" />
                                </linearGradient>
                                <linearGradient id={`grad-left-${message.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#764ba2" />
                                    <stop offset="100%" stopColor="#667eea" />
                                </linearGradient>
                                <linearGradient id={`grad-right-${message.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#66a6ff" />
                                    <stop offset="100%" stopColor="#89f7fe" />
                                </linearGradient>
                                <linearGradient id={`grad-node-${message.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#ffffff" />
                                    <stop offset="100%" stopColor="#e0eaff" />
                                </linearGradient>
                            </defs>
                            <g transform="translate(0, -8)">
                                <path d="M256 120 L384 194 L256 268 L128 194 Z" fill={`url(#grad-top-${message.id})`} />
                                <path d="M128 194 L128 342 L256 416 L256 268 Z" fill={`url(#grad-left-${message.id})`} />
                                <path d="M384 194 L384 342 L256 416 L256 268 Z" fill={`url(#grad-right-${message.id})`} />
                                <g stroke="#ffffff" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" fill="none">
                                    <path d="M256 120 L384 194 L384 342 L256 416 L128 342 L128 194 Z" />
                                    <path d="M128 194 L256 268 L384 194" />
                                    <path d="M256 268 L256 416" />
                                </g>
                                <g fill={`url(#grad-node-${message.id})`} stroke="#ffffff" strokeWidth="4">
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
                    )}
                </div>

                <div className={styles.messageBubble}>
                    {message.images && message.images.length > 0 && (
                        <div className={styles.imagesGrid}>
                            {message.images.map((image, index) => (
                                <div key={index} className={styles.imageWrapper}>
                                    <img src={image} alt={`Upload ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}

                    {message.thought && <ThoughtBlock thought={message.thought} isStreaming={isLoading && !message.content} />}

                    {message.content && (
                        <div className={styles.messageText}>
                            {message.role === 'assistant' ? (
                                <ErrorBoundary
                                    fallback={
                                        <div className={styles.errorState}>
                                            <p>内容渲染出错</p>
                                            <pre className={styles.rawContent}>{message.content}</pre>
                                        </div>
                                    }
                                >
                                    <div className={styles.renderedContent}>
                                        <ReactMarkdown
                                            remarkPlugins={remarkPlugins}
                                            rehypePlugins={rehypePlugins}
                                            components={{
                                                code({ inline, className, children, ...props }: CodeComponentProps) {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    return !inline ? (
                                                        <CodeBlock
                                                            language={match ? match[1] : ''}
                                                            value={String(children).replace(/\n$/, '')}
                                                            isStreaming={isLoading}
                                                        />
                                                    ) : (
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                }
                                            }}
                                        >
                                            {stableRenderContent}
                                        </ReactMarkdown>
                                    </div>
                                </ErrorBoundary>
                            ) : (
                                <p>{message.content}</p>
                            )}
                        </div>
                    )}

                    {message.grounding && (
                        <div className={styles.groundingContainer}>
                            {message.grounding.groundingChunks && message.grounding.groundingChunks.length > 0 && (
                                <div className={styles.groundingSources}>
                                    <div className={styles.groundingTitle}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                        搜索来源
                                    </div>
                                    <ul className={styles.groundingList}>
                                        {message.grounding.groundingChunks.map((chunk: GroundingChunk, i: number) => {
                                            const source = chunk.web?.title || chunk.web?.uri
                                            const uri = chunk.web?.uri
                                            return source ? (
                                                <li key={i}>
                                                    <a href={uri} target="_blank" rel="noopener noreferrer nofollow">
                                                        {source}
                                                    </a>
                                                </li>
                                            ) : null
                                        })}
                                    </ul>
                                </div>
                            )}

                            {searchQueries.length > 0 && (
                                <div className={styles.searchSuggestions}>
                                    <div className={styles.groundingTitle}>相关搜索词</div>
                                    <ul className={styles.groundingList}>
                                        {searchQueries.map((query, index) => (
                                            <li key={`${query}-${index}`}>{query}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {message.role === 'assistant' && !message.content && isLoading && (
                        <div className={styles.loadingDots}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}, (prev, next) => {
    return prev.message.content === next.message.content &&
        prev.message.thought === next.message.thought &&
        prev.message.images === next.message.images &&
        prev.message.grounding === next.message.grounding &&
        prev.isLoading === next.isLoading
})

MessageItem.displayName = 'MessageItem'

export default function MessageList({ messages, isLoading, onSelectSuggestion }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const listContainerRef = useRef<HTMLDivElement>(null)
    const [isScrolledUp, setIsScrolledUp] = useState(false)
    const [randomQuestions, setRandomQuestions] = useState<string[]>([])
    const [questionPool, setQuestionPool] = useState<string[]>([])
    const [poolIndex, setPoolIndex] = useState(0)
    const prevMessagesLength = useRef(messages.length)

    const handleScroll = () => {
        if (!listContainerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = listContainerRef.current
        const isBottom = scrollHeight - scrollTop - clientHeight < 150
        setIsScrolledUp(!isBottom)
    }

    const shuffle = (array: string[]) => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }

    const refreshQuestions = () => {
        let currentPool = questionPool
        let nextIndex = poolIndex

        if (currentPool.length === 0 || nextIndex + 4 > currentPool.length) {
            currentPool = shuffle(ALL_QUESTIONS)
            nextIndex = 0
            setQuestionPool(currentPool)
        }

        const newSet = currentPool.slice(nextIndex, nextIndex + 4)
        setRandomQuestions(newSet)
        setPoolIndex(nextIndex + 4)
    }

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (!listContainerRef.current) return;
        
        if (behavior === 'smooth') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            const container = listContainerRef.current;
            container.scrollTop = container.scrollHeight;
        }
    }

    useEffect(() => {
        if (messages.length === 0) {
            refreshQuestions()
        }
    }, [messages.length])

    useEffect(() => {
        const isNewMessage = messages.length > prevMessagesLength.current
        const isStreamingUpdate = messages.length === prevMessagesLength.current && isLoading

        if (isNewMessage) {
            setIsScrolledUp(false)
            scrollToBottom('auto')
        } else if (isStreamingUpdate && !isScrolledUp) {
            scrollToBottom('auto')
        }

        prevMessagesLength.current = messages.length
    }, [messages, isLoading, isScrolledUp])

    if (messages.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="grad-top-empty" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00f2fe" />
                                <stop offset="100%" stopColor="#4facfe" />
                            </linearGradient>
                            <linearGradient id="grad-left-empty" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#764ba2" />
                                <stop offset="100%" stopColor="#667eea" />
                            </linearGradient>
                            <linearGradient id="grad-right-empty" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#66a6ff" />
                                <stop offset="100%" stopColor="#89f7fe" />
                            </linearGradient>
                            <linearGradient id="grad-node-empty" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="#e0eaff" />
                            </linearGradient>
                            <filter id="cube-shadow-empty" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="16" stdDeviation="24" floodColor="#764ba2" floodOpacity="0.25" />
                            </filter>
                        </defs>
                        <g transform="translate(0, -8)" filter="url(#cube-shadow-empty)">
                            <path d="M256 120 L384 194 L256 268 L128 194 Z" fill="url(#grad-top-empty)" />
                            <path d="M128 194 L128 342 L256 416 L256 268 Z" fill="url(#grad-left-empty)" />
                            <path d="M384 194 L384 342 L256 416 L256 268 Z" fill="url(#grad-right-empty)" />
                            <g stroke="#ffffff" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" fill="none">
                                <path d="M256 120 L384 194 L384 342 L256 416 L128 342 L128 194 Z" />
                                <path d="M128 194 L256 268 L384 194" />
                                <path d="M256 268 L256 416" />
                            </g>
                            <g fill="url(#grad-node-empty)" stroke="#ffffff" strokeWidth="4">
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
                <h2 className={styles.emptyTitle}>开始新对话</h2>
                <p className={styles.emptySubtitle}>我可以帮你处理文本、分析图片，以及结合联网搜索回答问题。</p>

                <div className={styles.suggestions}>
                    <div className={styles.suggestionCard} onClick={() => onSelectSuggestion('支持长上下文对话是什么意思？')}>
                        <div className={styles.suggestionIcon}>💬</div>
                        <p>长上下文对话</p>
                    </div>
                    <div className={styles.suggestionCard} onClick={() => onSelectSuggestion('你能帮我分析这张图片吗？')}>
                        <div className={styles.suggestionIcon}>🖼️</div>
                        <p>图像理解与分析</p>
                    </div>
                    <div className={styles.suggestionCard} onClick={() => onSelectSuggestion('请帮我联网搜索一下最近的重要新闻。')}>
                        <div className={styles.suggestionIcon}>🌐</div>
                        <p>实时联网搜索</p>
                    </div>
                </div>

                <div className={styles.questionSection}>
                    <div className={styles.questionHeader}>
                        <p className={styles.questionHint}>猜你想问</p>
                        <button className={styles.refreshButton} onClick={refreshQuestions} title="换一批问题">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                            </svg>
                            <span>换一批</span>
                        </button>
                    </div>
                    <div className={styles.questionGrid}>
                        {randomQuestions.map((q, i) => (
                            <button key={i} className={styles.questionItem} onClick={() => onSelectSuggestion(q)}>
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.messageList} ref={listContainerRef} onScroll={handleScroll}>
            <div className={styles.messageContainer}>
                {messages.map((message, index) => (
                    <MessageItem
                        key={message.id}
                        message={message}
                        isLoading={isLoading && index === messages.length - 1}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}

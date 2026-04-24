'use client'

import { useState } from 'react'
import styles from './LoginScreen.module.css'

interface LoginScreenProps {
    onLogin: (password: string, remember: boolean) => Promise<boolean>
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [password, setPassword] = useState('')
    const [remember, setRemember] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const success = await onLogin(password, remember)

        if (!success) {
            setError('密码错误，请重试')
            setPassword('')
        }

        setIsLoading(false)
    }

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.gradient1}></div>
                <div className={styles.gradient2}></div>
                <div className={styles.gradient3}></div>
            </div>

            <div className={styles.loginCard}>
                <div className={styles.logoContainer}>
                    <div className={styles.logo}>
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
                    <p className={styles.subtitle}>安全连接已启用，登录后即可开始对话</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入访问密码"
                            className={styles.input}
                            disabled={isLoading}
                            autoFocus
                        />
                        {error && <p className={styles.error}>{error}</p>}
                    </div>

                    <div className={styles.optionsGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span>在此设备记住登录状态</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={isLoading || !password}
                    >
                        {isLoading ? <span className={styles.spinner}></span> : '开始连接'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>© 2025 Tyren Tech. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    private handleRecover = () => {
        this.setState({ hasError: false, error: null })
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{ padding: '1rem', border: '1px solid #ff4d4f', borderRadius: '0.5rem', background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>组件渲染失败</p>
                    <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', marginBottom: '1rem', wordBreak: 'break-all' }}>
                        {this.state.error?.message}
                    </p>
                    <button
                        onClick={this.handleRecover}
                        style={{ padding: '6px 12px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        清除异常并重试
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

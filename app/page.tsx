'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'
import LoginScreen from '@/components/LoginScreen'
import { getAuthToken, resetAuthSession, setAuthToken } from '@/lib/auth'

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        console.log('Mounting Home, checking auth...');
        const verifyAuth = async () => {
            const safetyTimer = setTimeout(() => {
                if (isLoading) {
                    console.warn('Authentication check timed out, forcing load.');
                    setIsLoading(false);
                }
            }, 5000);

            try {
                const authToken = getAuthToken();
                if (!authToken) {
                    setIsLoading(false);
                    clearTimeout(safetyTimer);
                    return;
                }

                const response = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    console.warn('Server rejected auth token');
                    resetAuthSession();
                    return;
                }
            } catch (e) {
                console.error('Failed to get/verify auth token:', e);
            } finally {
                setIsLoading(false);
                clearTimeout(safetyTimer);
            }
        };

        verifyAuth();
    }, [])

    const handleLogin = async (password: string, remember: boolean): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            })

            if (response.ok) {
                const { token } = await response.json()
                setAuthToken(token, remember)
                setIsAuthenticated(true)
                return true
            }
            return false
        } catch (error) {
            console.error('Login error:', error)
            return false
        }
    }

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--bg-primary)',
            }}>
                <div className="spin" style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(102, 126, 234, 0.2)',
                    borderTopColor: '#667eea',
                    borderRadius: '50%',
                }} />
            </div>
        )
    }

    return isAuthenticated ? <ChatInterface /> : <LoginScreen onLogin={handleLogin} />
}

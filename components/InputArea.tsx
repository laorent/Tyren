'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './InputArea.module.css'

interface InputAreaProps {
    onSend: (content: string, images: string[]) => void
    disabled: boolean
    onStop: () => void
    externalContent?: string
}

export default function InputArea({ onSend, disabled, onStop, externalContent }: InputAreaProps) {
    const [content, setContent] = useState('')
    const [images, setImages] = useState<string[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!externalContent) return

        setContent(externalContent)
        if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }, [externalContent])

    const handleSend = () => {
        if ((!content.trim() && images.length === 0) || disabled) return

        if (content.length > 50000) {
            alert(`发送已中止：输入内容达到 ${content.length.toLocaleString()} 个字符，超过单次 50,000 字符限制。请精简后重试。`)
            return
        }

        onSend(content, images)
        setContent('')
        setImages([])

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !disabled) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value)

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('图片处理超时'))
            }, 10000)

            const reader = new FileReader()
            reader.readAsDataURL(file)

            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string

                img.onerror = () => {
                    clearTimeout(timeout)
                    reject(new Error('图片加载失败'))
                }

                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 1200
                    const MAX_HEIGHT = 1200
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }

                    canvas.width = width
                    canvas.height = height

                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height)
                    }

                    const isTransparent = file.type === 'image/png' || file.type === 'image/webp'
                    const outputFormat = isTransparent ? 'image/webp' : 'image/jpeg'
                    const quality = isTransparent ? 0.85 : 0.7
                    const dataUrl = canvas.toDataURL(outputFormat, quality)

                    clearTimeout(timeout)
                    resolve(dataUrl)
                }
            }

            reader.onerror = () => {
                clearTimeout(timeout)
                reject(new Error('文件读取失败'))
            }
        })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const MAX_FILE_SIZE_MB = 10
        const validFiles: File[] = []

        for (let i = 0; i < files.length; i++) {
            if (files[i].size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                alert(`图片 "${files[i].name}" 超过 ${MAX_FILE_SIZE_MB}MB，已自动忽略。`)
                continue
            }
            validFiles.push(files[i])
        }

        if (validFiles.length === 0) {
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        try {
            const compressedImages = await Promise.all(validFiles.map((file) => compressImage(file)))
            setImages((prev) => [...prev, ...compressedImages])
        } catch (error: unknown) {
            console.error('Image upload failed:', error)
            const errMsg = error instanceof Error ? error.message : '未知错误'
            alert(`部分图片处理失败：${errMsg}`)
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }

    return (
        <div className={styles.inputContainer}>
            {images.length > 0 && (
                <div className={styles.imagePreview}>
                    {images.map((img, index) => (
                        <div key={index} className={styles.previewItem}>
                            <img src={img} alt="Preview" />
                            <button
                                className={styles.removeButton}
                                onClick={() => removeImage(index)}
                                title="移除图片"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.inputWrapper}>
                <button
                    className={styles.uploadButton}
                    onClick={() => fileInputRef.current?.click()}
                    title="上传图片"
                    disabled={disabled}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    hidden
                />

                <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    placeholder="输入消息，Shift+Enter 换行"
                    value={content}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    rows={1}
                />

                {disabled ? (
                    <button className={styles.stopButton} onClick={onStop} title="停止生成">
                        <div className={styles.stopSquare}></div>
                    </button>
                ) : (
                    <button
                        className={styles.sendButton}
                        onClick={handleSend}
                        disabled={!content.trim() && images.length === 0}
                        title="发送消息"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}

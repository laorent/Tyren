import { NextResponse } from 'next/server'
import { deriveSecret } from '@/lib/server-auth'

export async function POST(req: Request) {
    try {
        const { password } = await req.json()
        const validPassword = process.env.WEB_ACCESS_PASSWORD

        if (!validPassword) {
            return NextResponse.json(
                { error: 'Server authentication not configured' },
                { status: 500 }
            )
        }

        if (password === validPassword) {
            const secretKey = await deriveSecret(validPassword)
            const timestamp = Date.now().toString()
            const data = new TextEncoder().encode(`${timestamp}:${secretKey}`)
            const hashBuffer = await crypto.subtle.digest('SHA-256', data)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
            const dynamicToken = `${timestamp}.${hashHex}`

            return NextResponse.json({ token: dynamicToken })
        }

        await new Promise((resolve) => setTimeout(resolve, 2000))
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

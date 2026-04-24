import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/server-auth'

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization')
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing token' }, { status: 401 })
        }
        
        const token = authHeader.split(' ')[1]
        const isValid = await verifyToken(token)

        if (isValid) {
            return NextResponse.json({ valid: true })
        }

        // Add a small delay for failed checks to deter timing attacks
        await new Promise(resolve => setTimeout(resolve, 500));
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

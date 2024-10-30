import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { messages } = await request.json()

  try {
    const response = await fetch('https://hntr.livecannon.workers.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch from Cloudflare worker')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
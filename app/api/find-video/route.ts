import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query) return NextResponse.json({ error: 'No query provided' }, { status: 400 })

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })

  const params = new URLSearchParams({
    part: 'snippet',
    q: `${query} recipe`,
    type: 'video',
    maxResults: '1',
    relevanceLanguage: 'he',
    key: apiKey,
  })

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
  const data = await res.json()

  const videoId = data.items?.[0]?.id?.videoId
  if (!videoId) return NextResponse.json({ error: 'No video found' }, { status: 404 })

  return NextResponse.json({ url: `https://www.youtube.com/watch?v=${videoId}` })
}

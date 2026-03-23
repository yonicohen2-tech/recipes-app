import { NextRequest, NextResponse } from 'next/server'

const HEBREW_REGEX = /[\u0590-\u05FF]/

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query) return NextResponse.json({ error: 'No query provided' }, { status: 400 })

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })

  const isHebrew = HEBREW_REGEX.test(query)
  const searchQuery = isHebrew ? `${query} מתכון` : `${query} recipe`
  const lang = isHebrew ? 'he' : 'en'

  const params = new URLSearchParams({
    part: 'snippet',
    q: searchQuery,
    type: 'video',
    maxResults: '1',
    relevanceLanguage: lang,
    key: apiKey,
  })

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
  const data = await res.json()

  const videoId = data.items?.[0]?.id?.videoId
  if (!videoId) return NextResponse.json({ error: 'No video found' }, { status: 404 })

  return NextResponse.json({ url: `https://www.youtube.com/watch?v=${videoId}` })
}

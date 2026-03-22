import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const mimeType = file.type
  const isImage = SUPPORTED_IMAGE_TYPES.includes(mimeType)
  const isPdf = mimeType === 'application/pdf'

  if (!isImage && !isPdf) {
    return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or image.' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const contentBlock = isPdf
    ? {
        type: 'document' as const,
        source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
      }
    : {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: base64,
        },
      }

  const prompt = `You are analyzing a recipe document. Extract the following information and return it as a single JSON object with exactly these keys:

{
  "title": string,
  "description": string (1-2 sentence summary of the dish, in the same language as the recipe),
  "course_type": one of: "appetizer" | "first-course" | "main-course" | "side-dish" | "dessert" | "drink" | "snack",
  "difficulty": one of: "easy" | "medium" | "hard",
  "prep_time": number (minutes, integer),
  "cook_time": number (minutes, integer),
  "dietary_tags": array of any that apply: ["dairy", "non-dairy", "gluten-free", "vegan", "vegetarian", "meat"]
}

Rules:
- If prep or cook time is not mentioned, estimate based on the recipe steps.
- dietary_tags: include "meat" if the recipe contains meat/poultry/fish. Include "dairy" if it contains dairy. Include "non-dairy" if it has no dairy. Include "vegan" if fully plant-based. Include "vegetarian" if no meat but may have dairy/eggs. Include "gluten-free" if no gluten ingredients.
- Return ONLY the JSON object, no other text.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [contentBlock, { type: 'text', text: prompt }],
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : text)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to parse recipe data from file' }, { status: 500 })
  }
}

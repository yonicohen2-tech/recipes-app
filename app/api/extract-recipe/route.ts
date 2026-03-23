import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

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

  const prompt = `You are analyzing a recipe document. Extract ALL possible information and return it as a single JSON object with exactly these keys:

{
  "title": string (name of the recipe, in original language),
  "description": string (1-2 sentence summary of the dish, in the same language as the recipe),
  "course_type": one of: "appetizer" | "first-course" | "main-course" | "side-dish" | "dessert" | "drink" | "snack",
  "difficulty": one of: "easy" | "medium" | "hard",
  "prep_time": number (minutes, integer — time to prepare before cooking),
  "cook_time": number (minutes, integer — actual cooking/baking time),
  "servings": number (integer — how many people the recipe serves),
  "dietary_tags": array of any that apply: ["dairy", "non-dairy", "gluten-free", "vegan", "vegetarian", "meat"],
  "ingredients": array of strings, each being one ingredient with its exact quantity (e.g. "2 cups flour", "1 tsp salt"). Keep in the original language.
  "instructions": string with the full step-by-step preparation instructions, numbered. Keep in the original language.
  "notes": string with any tips, variations, storage instructions, substitutions, or other useful notes from the recipe. Keep in the original language. null if none.
}

Rules:
- Extract ALL information present in the document — do not skip any field if the data is available.
- If prep or cook time is not explicitly mentioned, estimate based on the steps.
- If servings is not mentioned, estimate based on the recipe type and quantities.
- dietary_tags: include "meat" if contains meat/poultry/fish, "dairy" if contains dairy, "non-dairy" if no dairy, "vegan" if fully plant-based, "vegetarian" if no meat, "gluten-free" if no gluten ingredients.
- ingredients: list every single ingredient separately with quantity. Do not combine ingredients.
- instructions: format as clear numbered steps, one per line.
- notes: include any chef tips, variations, how to store, how to reheat, substitutions, or serving suggestions.
- Return ONLY the JSON object, no other text.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
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

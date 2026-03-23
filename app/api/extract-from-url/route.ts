import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

  let pageText = ''

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'he,en;q=0.9',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Could not access this URL. Facebook and some sites require login.' }, { status: 400 })
    }

    const html = await res.text()

    // Extract YouTube video description from JSON-LD or page data
    const ytDescMatch = html.match(/"description":\{"simpleText":"([\s\S]*?)"\}/)
    if (ytDescMatch) {
      pageText = ytDescMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
    }

    // Generic: strip HTML tags and get text
    if (!pageText) {
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .slice(0, 8000)
    }
  } catch {
    return NextResponse.json({ error: 'Could not fetch this URL. Facebook and some sites block external access.' }, { status: 400 })
  }

  if (!pageText.trim()) {
    return NextResponse.json({ error: 'No content found at this URL.' }, { status: 400 })
  }

  const prompt = `You are analyzing text extracted from a webpage or video description that contains a recipe. Extract ALL possible information and return a single JSON object with exactly these keys:

{
  "title": string (name of the recipe, in original language),
  "description": string (1-2 sentence summary, in the same language as the recipe),
  "course_type": one of: "appetizer" | "first-course" | "main-course" | "side-dish" | "dessert" | "drink" | "snack",
  "difficulty": one of: "easy" | "medium" | "hard",
  "prep_time": number (minutes, integer),
  "cook_time": number (minutes, integer),
  "servings": number (integer — how many people it serves),
  "dietary_tags": array of any that apply: ["dairy", "non-dairy", "gluten-free", "vegan", "vegetarian", "meat"],
  "ingredients": array of strings, each being one ingredient with quantity. Keep in the original language.
  "instructions": string with numbered preparation steps. Keep in the original language.
  "notes": string with any tips, variations, storage info, substitutions. null if none. Keep in original language.
}

Rules:
- Extract ALL information present — do not skip any field if the data is available.
- If prep or cook time is not mentioned, estimate based on the steps.
- If servings is not mentioned, estimate based on recipe type and quantities.
- dietary_tags: include "meat" if contains meat/poultry/fish, "dairy" if contains dairy, "non-dairy" if no dairy, "vegan" if fully plant-based, "vegetarian" if no meat, "gluten-free" if no gluten.
- notes: include chef tips, variations, storage, reheating, substitutions, serving suggestions.
- If this page does not contain a recipe, return { "error": "No recipe found on this page" }
- Return ONLY the JSON object, no other text.

Page content:
${pageText}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : text)
    if (data.error) return NextResponse.json({ error: data.error }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Could not extract recipe data from this page' }, { status: 500 })
  }
}

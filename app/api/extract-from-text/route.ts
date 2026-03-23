import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic()

const RECIPE_PROMPT = `You are analyzing pasted recipe text. Extract ALL possible information and return a single JSON object with exactly these keys:

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
- dietary_tags: "meat" if contains meat/poultry/fish, "dairy" if contains dairy, "non-dairy" if no dairy, "vegan" if fully plant-based, "vegetarian" if no meat, "gluten-free" if no gluten.
- Return ONLY the JSON object, no other text.`

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: `${RECIPE_PROMPT}\n\nRecipe text:\n${text.slice(0, 10000)}` }],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    return NextResponse.json(JSON.parse(jsonMatch ? jsonMatch[0] : responseText))
  } catch {
    return NextResponse.json({ error: 'Could not extract recipe data from text' }, { status: 500 })
  }
}

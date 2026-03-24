import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are helping filter a recipe database. The user said: "${text}"

Extract filter criteria and return a JSON object with these optional keys (only include keys that are clearly mentioned):
{
  "search": string (free text to search in recipe title/description, if user mentions a specific dish),
  "course_type": one of: "appetizer" | "first-course" | "main-course" | "side-dish" | "dessert" | "drink" | "snack",
  "dietary": one of: "dairy" | "non-dairy" | "gluten-free" | "vegan" | "vegetarian" | "meat",
  "difficulty": one of: "easy" | "medium" | "hard",
  "max_time": number (maximum total time in minutes — prep + cook combined)
}

Examples:
- "dairy recipe under 30 minutes" → {"dietary":"dairy","max_time":30}
- "easy vegan main course" → {"difficulty":"easy","dietary":"vegan","course_type":"main-course"}
- "chocolate cake" → {"search":"chocolate cake"}
- "מתכון בשרי עד 45 דקות" → {"dietary":"meat","max_time":45}
- "משהו מהיר וקל לארוחת ערב" → {"difficulty":"easy","max_time":30,"course_type":"main-course"}

Return ONLY the JSON object, no other text.`
    }]
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    return NextResponse.json(JSON.parse(jsonMatch ? jsonMatch[0] : '{}'))
  } catch {
    return NextResponse.json({})
  }
}

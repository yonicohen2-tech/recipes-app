'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/context'
import Navbar from '@/components/Navbar'
import type { CourseType, DietaryTag, Difficulty, Recipe } from '@/lib/types'

const COURSE_TYPES: CourseType[] = ['appetizer', 'first-course', 'main-course', 'side-dish', 'dessert', 'drink', 'snack']
const KASHRUT_TAGS: DietaryTag[] = ['dairy', 'non-dairy', 'meat', 'vegan', 'vegetarian']
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export default function EditRecipePage() {
  const { t, isRTL } = useLang()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    course_type: 'main-course' as CourseType,
    dietary_tags: [] as DietaryTag[],
    difficulty: 'medium' as Difficulty,
    prep_time: '',
    cook_time: '',
    video_url: '',
    ingredients: [] as string[],
    instructions: '',
    servings: '',
    notes: '',
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('recipes').select('*').eq('id', id).single(),
      supabase.auth.getUser(),
    ]).then(([{ data: recipe }, { data: userData }]) => {
      if (!recipe) { router.push('/'); return }
      if (!userData.user || userData.user.id !== recipe.added_by) { router.push(`/recipes/${id}`); return }
      setForm({
        title: recipe.title || '',
        description: recipe.description || '',
        course_type: recipe.course_type,
        dietary_tags: recipe.dietary_tags || [],
        difficulty: recipe.difficulty,
        prep_time: recipe.prep_time?.toString() || '',
        cook_time: recipe.cook_time?.toString() || '',
        video_url: recipe.video_url || '',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || '',
        servings: recipe.servings?.toString() || '',
        notes: recipe.notes || '',
      })
      setFetching(false)
    })
  }, [id])

  const toggleDietaryTag = (tag: DietaryTag) => {
    setForm((f) => {
      if (tag === 'gluten-free') {
        return {
          ...f,
          dietary_tags: f.dietary_tags.includes('gluten-free')
            ? f.dietary_tags.filter((t) => t !== 'gluten-free')
            : [...f.dietary_tags, 'gluten-free'],
        }
      }
      const withoutKashrut = f.dietary_tags.filter((t) => !KASHRUT_TAGS.includes(t as DietaryTag))
      return {
        ...f,
        dietary_tags: f.dietary_tags.includes(tag)
          ? withoutKashrut
          : [...withoutKashrut, tag],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.from('recipes').update({
      title: form.title,
      description: form.description || null,
      course_type: form.course_type,
      dietary_tags: form.dietary_tags,
      difficulty: form.difficulty,
      prep_time: parseInt(form.prep_time) || 0,
      cook_time: parseInt(form.cook_time) || 0,
      video_url: form.video_url || null,
      ingredients: form.ingredients,
      instructions: form.instructions || null,
      servings: parseInt(form.servings) || null,
      notes: form.notes || null,
    }).eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      router.push(`/recipes/${id}`)
    }
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

  if (fetching) return <div dir={isRTL ? 'rtl' : 'ltr'}><Navbar /><p className="text-center py-16 text-gray-400">{t('loading')}</p></div>

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')} — {form.title}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('title')}</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
          </div>

          {/* Course type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('courseType')}</label>
            <select value={form.course_type} onChange={(e) => setForm({ ...form, course_type: e.target.value as CourseType })} className={inputClass}>
              {COURSE_TYPES.map((c) => <option key={c} value={c}>{t(c as any)}</option>)}
            </select>
          </div>

          {/* Dietary tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('dairyMeatCol')}</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {KASHRUT_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleDietaryTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    form.dietary_tags.includes(tag) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}>
                  {t(tag as any)}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input type="checkbox" checked={form.dietary_tags.includes('gluten-free')} onChange={() => toggleDietaryTag('gluten-free')} className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-gray-700">{t('gluten-free' as any)}</span>
            </label>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('difficultyLabel')}</label>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} className={inputClass}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(d as any)}</option>)}
            </select>
          </div>

          {/* Times + Servings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prepTimeLabel')}</label>
              <input type="number" min="0" value={form.prep_time} onChange={(e) => setForm({ ...form, prep_time: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('cookTimeLabel')}</label>
              <input type="number" min="0" value={form.cook_time} onChange={(e) => setForm({ ...form, cook_time: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input type="number" min="1" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('ingredients')}</label>
            <textarea
              value={form.ingredients.join('\n')}
              onChange={(e) => setForm({ ...form, ingredients: e.target.value.split('\n').filter(Boolean) })}
              rows={6}
              placeholder="One ingredient per line"
              className={`${inputClass} resize-none`}
              dir="auto"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructions')}</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              rows={6}
              className={`${inputClass} resize-none`}
              dir="auto"
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('videoLink')}</label>
            <input type="url" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className={inputClass} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tips & Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={`${inputClass} resize-none`} dir="auto" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? t('loading') : t('submit')}
            </button>
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium">
              {t('cancel')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

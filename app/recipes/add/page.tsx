'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/context'
import Navbar from '@/components/Navbar'
import type { CourseType, DietaryTag, Difficulty } from '@/lib/types'
import { Upload, Sparkles, Loader2, Link2 } from 'lucide-react'

const COURSE_TYPES: CourseType[] = ['appetizer', 'first-course', 'main-course', 'side-dish', 'dessert', 'drink', 'snack']
const DIETARY_TAGS: DietaryTag[] = ['dairy', 'non-dairy', 'gluten-free', 'vegan', 'vegetarian', 'meat']
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export default function AddRecipePage() {
  const { t, isRTL } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractingUrl, setExtractingUrl] = useState(false)
  const [extracted, setExtracted] = useState(false)
  const [findingVideo, setFindingVideo] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)

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
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
    })
  }, [])

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile)
    setExtracted(false)
    setError('')

    const supported = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!supported.includes(selectedFile.type)) return

    setExtracting(true)
    const fd = new FormData()
    fd.append('file', selectedFile)

    try {
      const res = await fetch('/api/extract-recipe', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setForm((f) => ({
          ...f,
          title: data.title || f.title,
          description: data.description || f.description,
          course_type: data.course_type || f.course_type,
          difficulty: data.difficulty || f.difficulty,
          prep_time: data.prep_time?.toString() || f.prep_time,
          cook_time: data.cook_time?.toString() || f.cook_time,
          dietary_tags: data.dietary_tags || f.dietary_tags,
          ingredients: data.ingredients || f.ingredients,
          instructions: data.instructions || f.instructions,
          servings: data.servings?.toString() || f.servings,
          notes: data.notes || f.notes,
        }))
        setExtracted(true)
        if (data.title) findAndSetVideo(data.title)
      } else {
        setError(data.error || 'Could not extract recipe data')
      }
    } catch {
      setError('Failed to analyze file')
    } finally {
      setExtracting(false)
    }
  }

  const handleExtractFromUrl = async (urlOverride?: string) => {
    const url = urlOverride || form.video_url
    if (!url) return
    setExtractingUrl(true)
    setError('')
    try {
      const res = await fetch('/api/extract-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (res.ok) {
        setForm((f) => ({
          ...f,
          title: data.title || f.title,
          description: data.description || f.description,
          course_type: data.course_type || f.course_type,
          difficulty: data.difficulty || f.difficulty,
          prep_time: data.prep_time?.toString() || f.prep_time,
          cook_time: data.cook_time?.toString() || f.cook_time,
          dietary_tags: data.dietary_tags || f.dietary_tags,
          ingredients: data.ingredients || f.ingredients,
          instructions: data.instructions || f.instructions,
          servings: data.servings?.toString() || f.servings,
          notes: data.notes || f.notes,
        }))
        setExtracted(true)
        if (data.title && !url.includes('youtube.com') && !url.includes('youtu.be')) {
          findAndSetVideo(data.title)
        }
      } else {
        setError(data.error || 'Could not extract recipe from this link')
      }
    } catch {
      setError('Failed to fetch from this URL')
    } finally {
      setExtractingUrl(false)
    }
  }

  const findAndSetVideo = async (title: string) => {
    if (!title) return
    setFindingVideo(true)
    try {
      const res = await fetch('/api/find-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, video_url: f.video_url || data.url }))
      }
    } catch {}
    finally { setFindingVideo(false) }
  }

  const toggleDietaryTag = (tag: DietaryTag) => {
    setForm((f) => ({
      ...f,
      dietary_tags: f.dietary_tags.includes(tag)
        ? f.dietary_tags.filter((t) => t !== tag)
        : [...f.dietary_tags, tag],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let file_url = null
    let file_type = null

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('recipe-files')
        .upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('recipe-files').getPublicUrl(path)
      file_url = urlData.publicUrl
      file_type = file.type
    }

    const { error: insertError } = await supabase.from('recipes').insert({
      title: form.title,
      description: form.description || null,
      course_type: form.course_type,
      dietary_tags: form.dietary_tags,
      difficulty: form.difficulty,
      prep_time: parseInt(form.prep_time) || 0,
      cook_time: parseInt(form.cook_time) || 0,
      video_url: form.video_url || null,
      file_url,
      file_type,
      ingredients: form.ingredients,
      instructions: form.instructions || null,
      servings: parseInt(form.servings) || null,
      notes: form.notes || null,
      added_by: user.id,
      added_by_name: user.user_metadata?.full_name || user.email,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('addRecipe')}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('title')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Course type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('courseType')}</label>
            <select
              value={form.course_type}
              onChange={(e) => setForm({ ...form, course_type: e.target.value as CourseType })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {COURSE_TYPES.map((c) => <option key={c} value={c}>{t(c as any)}</option>)}
            </select>
          </div>

          {/* Dietary tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('dietaryTags')}</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleDietaryTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    form.dietary_tags.includes(tag)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {t(tag as any)}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('difficultyLabel')}</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(d as any)}</option>)}
            </select>
          </div>

          {/* Times + Servings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prepTimeLabel')}</label>
              <input
                type="number"
                min="0"
                value={form.prep_time}
                onChange={(e) => setForm({ ...form, prep_time: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('cookTimeLabel')}</label>
              <input
                type="number"
                min="0"
                value={form.cook_time}
                onChange={(e) => setForm({ ...form, cook_time: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input
                type="number"
                min="1"
                value={form.servings}
                onChange={(e) => setForm({ ...form, servings: e.target.value })}
                placeholder="e.g. 4"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipeFile')}</label>
            <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              extracted ? 'border-green-400 bg-green-50' : extracting ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
            }`}>
              {extracting ? (
                <>
                  <Loader2 size={24} className="text-orange-400 mb-1 animate-spin" />
                  <span className="text-sm text-orange-500 font-medium">Reading recipe...</span>
                </>
              ) : extracted ? (
                <>
                  <Sparkles size={24} className="text-green-500 mb-1" />
                  <span className="text-sm text-green-600 font-medium">Recipe extracted! Fields filled below.</span>
                  <span className="text-xs text-gray-400 mt-0.5">{file?.name}</span>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-gray-400 mb-1" />
                  <span className="text-sm text-gray-500">{file ? file.name : 'PDF, JPG, PNG... (auto-fills the form)'}</span>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.mp4,.mov,.avi"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }}
                className="hidden"
              />
            </label>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('videoLink')}</label>
            <div className="relative">
              <input
                type="url"
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text')
                  if (pasted.startsWith('http')) {
                    setTimeout(() => handleExtractFromUrl(pasted), 100)
                  }
                }}
                placeholder="Paste a YouTube or recipe link to auto-fill..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {(extractingUrl || findingVideo) && (
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  <Loader2 size={16} className="animate-spin text-orange-400" />
                  {findingVideo && <span className="text-xs text-orange-400">Finding video...</span>}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Paste a link — recipe data will be extracted automatically. Works best with YouTube.</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tips & Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Storage tips, variations, substitutions..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? t('loading') : t('submit')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

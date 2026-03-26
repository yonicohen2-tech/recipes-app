'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/context'
import Navbar from '@/components/Navbar'
import type { CourseType, DietaryTag, Difficulty } from '@/lib/types'
import { Upload, Sparkles, Loader2, Link2, X } from 'lucide-react'

const COURSE_TYPES: CourseType[] = ['appetizer', 'first-course', 'main-course', 'side-dish', 'dessert', 'drink', 'snack']
const KASHRUT_TAGS: DietaryTag[] = ['dairy', 'non-dairy', 'meat', 'fish', 'vegan', 'vegetarian']
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export default function AddRecipePage() {
  const { t, isRTL } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractingUrl, setExtractingUrl] = useState(false)
  const [extractingText, setExtractingText] = useState(false)
  const [extracted, setExtracted] = useState(false)
  const [findingVideo, setFindingVideo] = useState(false)
  const [videoOptions, setVideoOptions] = useState<{id:string,title:string,channel:string,thumbnail:string,url:string}[]>([])
  const [pastedText, setPastedText] = useState('')
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])

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

  const handleFilesChange = async (selectedFiles: FileList) => {
    const newFiles = Array.from(selectedFiles)
    setFiles((prev) => [...prev, ...newFiles])
    setExtracted(false)
    setError('')

    // Auto-extract only when a single file is selected
    if (newFiles.length !== 1) return
    const extractable = newFiles.find((f) =>
      ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)
    )
    if (!extractable) return

    if (extractable.size > 4 * 1024 * 1024) {
      setError('File is too large (max 4MB). Please use a smaller image or compress the PDF.')
      return
    }

    setExtracting(true)
    const fd = new FormData()
    fd.append('file', extractable)

    try {
      const res = await fetch('/api/extract-recipe', { method: 'POST', body: fd })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { setError('File too large or server error. Try a smaller file.'); setExtracting(false); return }
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
    } catch (e: any) {
      setError(e?.message || 'Failed to analyze file')
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
    setVideoOptions([])
    try {
      const res = await fetch('/api/find-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title }),
      })
      const data = await res.json()
      if (res.ok && data.videos) {
        setVideoOptions(data.videos)
      }
    } catch {}
    finally { setFindingVideo(false) }
  }

  const handleExtractFromText = async () => {
    if (!pastedText.trim()) return
    setExtractingText(true)
    setError('')
    try {
      const res = await fetch('/api/extract-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedText }),
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
        setPastedText('')
        if (data.title) findAndSetVideo(data.title)
      } else {
        setError(data.error || 'Could not extract recipe from text')
      }
    } catch {
      setError('Failed to extract from text')
    } finally {
      setExtractingText(false)
    }
  }

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
      // Kashrut tags are mutually exclusive
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let file_url = null
    let file_type = null
    const file_urls: string[] = []

    for (const f of files) {
      const ext = f.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('recipe-files')
        .upload(path, f)
      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('recipe-files').getPublicUrl(path)
      file_urls.push(urlData.publicUrl)
    }

    if (file_urls.length > 0) {
      file_url = file_urls[0]
      file_type = files[0].type
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
      file_urls: file_urls.length > 0 ? file_urls : null,
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('dairyMeatCol')}</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {KASHRUT_TAGS.map((tag) => (
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
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.dietary_tags.includes('gluten-free')}
                onChange={() => toggleDietaryTag('gluten-free')}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm text-gray-700">{t('gluten-free' as any)}</span>
            </label>
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

          {/* Paste recipe text */}
          <div className="border border-dashed border-orange-200 rounded-xl p-4 bg-orange-50/30">
            <label className="block text-sm font-medium text-gray-700 mb-2">Paste recipe text</label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={4}
              placeholder="Paste any recipe text here — ingredients, instructions, times... Claude will extract everything automatically."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-white"
            />
            <button
              type="button"
              onClick={handleExtractFromText}
              disabled={!pastedText.trim() || extractingText}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {extractingText ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {extractingText ? 'Extracting...' : 'Extract recipe'}
            </button>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipeFile')}</label>
            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
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
                  <span className="text-sm text-green-600 font-medium">Recipe extracted!</span>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-gray-400 mb-1" />
                  <span className="text-sm text-gray-500">PDF, JPG, PNG, DOCX... — click to add files</span>
                </>
              )}
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.mp4,.mov,.avi"
                onChange={(e) => { if (e.target.files?.length) handleFilesChange(e.target.files) }}
                className="hidden"
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="ml-2 text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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

            {/* Video options picker */}
            {videoOptions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Pick the matching video:</p>
                <div className="space-y-2">
                  {videoOptions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, video_url: v.url })); setVideoOptions([]) }}
                      className="flex items-center gap-3 w-full text-left p-2 rounded-lg border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      {v.thumbnail && <img src={v.thumbnail} alt="" className="w-16 h-12 rounded object-cover shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{v.title}</p>
                        <p className="text-xs text-gray-400">{v.channel}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setVideoOptions([])}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    None of these — skip
                  </button>
                </div>
              </div>
            )}
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

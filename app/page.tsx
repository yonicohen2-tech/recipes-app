'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/context'
import Navbar from '@/components/Navbar'
import type { Recipe, Comment, CourseType, DietaryTag } from '@/lib/types'
import { detectDir } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import { Search, Clock, ChefHat, X, PlayCircle, MessageCircle, Trash2, Send, Mic, MicOff } from 'lucide-react'
import CookingAnimation from '@/components/CookingAnimation'

const COURSE_TYPES: CourseType[] = ['appetizer', 'first-course', 'main-course', 'side-dish', 'dessert', 'drink', 'snack']
const DIETARY_TAGS: DietaryTag[] = ['dairy', 'non-dairy', 'gluten-free', 'vegan', 'vegetarian', 'meat']
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

const difficultyColor = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

const dietaryColor: Record<string, string> = {
  meat: 'bg-red-50 text-red-600',
  dairy: 'bg-blue-50 text-blue-600',
  vegan: 'bg-green-50 text-green-700',
  vegetarian: 'bg-lime-50 text-lime-700',
  'non-dairy': 'bg-purple-50 text-purple-600',
  'gluten-free': 'bg-amber-50 text-amber-700',
}

const selectClass = 'w-full border border-gray-200 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 text-gray-600'

function IngredientsCell({ ingredients, title, t }: { ingredients: string[], title: string, t: (k: any) => string }) {
  const [hover, setHover] = useState(false)
  const [modal, setModal] = useState(false)
  if (!ingredients || ingredients.length === 0) return <span className="text-gray-300">—</span>

  return (
    <>
      <div className="relative inline-block">
        <button
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={() => setModal(true)}
          className="text-orange-500 hover:text-orange-600 text-sm font-medium underline decoration-dotted"
        >
          {ingredients.length} {t('ingredients')}
        </button>
        {hover && !modal && (
          <div className="absolute z-50 bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-56 text-sm pointer-events-none">
            <p className="text-xs text-gray-400 mb-1">Click to see all</p>
            <ul className="space-y-1 max-h-36 overflow-hidden">
              {ingredients.slice(0, 6).map((ing, i) => (
                <li key={i} className="text-gray-600 flex items-start gap-1.5">
                  <span className="text-orange-400 mt-1 shrink-0">•</span>
                  {ing}
                </li>
              ))}
              {ingredients.length > 6 && <li className="text-gray-400 text-xs">+{ingredients.length - 6} more...</li>}
            </ul>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{title}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-3">{t('ingredients')}</p>
            <ul className="space-y-2 max-h-80 overflow-y-auto mb-4">
              {ingredients.map((ing, i) => (
                <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                  <span className="text-orange-400 font-bold mt-0.5 shrink-0">•</span>
                  {ing}
                </li>
              ))}
            </ul>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`*${title} - ${t('ingredients')}:*\n${ingredients.map(i => `• ${i}`).join('\n')}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle size={16} />
              Send ingredient list to WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  )
}

function CommentsModal({ recipe, user, t, onClose }: { recipe: Recipe, user: User | null, t: (k: any) => string, onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('comments').select('*').eq('recipe_id', recipe.id).order('created_at', { ascending: true })
      .then(({ data }) => { setComments(data || []); setLoading(false) })
  }, [recipe.id])

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return
    setSubmitting(true)
    const supabase = createClient()
    const { data } = await supabase.from('comments').insert({
      recipe_id: recipe.id,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email,
      content: newComment.trim(),
    }).select().single()
    if (data) { setComments((c) => [...c, data]); setNewComment('') }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">{recipe.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-3">{t('comments')} ({comments.length})</p>

        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
          {loading ? (
            <p className="text-sm text-gray-400">{t('loading')}</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400">No comments yet.</p>
          ) : comments.map((c) => (
            <div key={c.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">{c.user_name}</span>
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700">{c.content}</p>
            </div>
          ))}
        </div>

        {user ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={t('addComment')}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400"><a href="/login" className="text-orange-500 hover:underline">{t('signIn')}</a> to comment</p>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { t, isRTL, lang } = useLang()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [commentsRecipe, setCommentsRecipe] = useState<Recipe | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [maxTime, setMaxTime] = useState<number | null>(null)
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [voiceInputText, setVoiceInputText] = useState('')
  const [processingVoice, setProcessingVoice] = useState(false)

  // Column filters
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [dietaryFilter, setDietaryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [addedByFilter, setAddedByFilter] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user))
    supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRecipes(data || []); setLoading(false) })
  }, [])

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('recipes').delete().eq('id', id)
    setRecipes((r) => r.filter((x) => x.id !== id))
    setDeleteId(null)
  }

  const uniqueAuthors = useMemo(
    () => Array.from(new Set(recipes.map((r) => r.added_by_name))).sort(),
    [recipes]
  )

  const hasActiveFilters = search || courseFilter || dietaryFilter || difficultyFilter || addedByFilter

  const clearFilters = () => {
    setSearch(''); setCourseFilter(''); setDietaryFilter(''); setDifficultyFilter(''); setAddedByFilter(''); setMaxTime(null); setVoiceText('')
  }

  const applyVoiceFilters = async (transcript: string) => {
    setVoiceText(transcript)
    setProcessingVoice(true)
    try {
      const res = await fetch('/api/parse-voice-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      })
      const filters = await res.json()
      if (filters.search) setSearch(filters.search)
      if (filters.course_type) setCourseFilter(filters.course_type)
      if (filters.dietary) setDietaryFilter(filters.dietary)
      if (filters.difficulty) setDifficultyFilter(filters.difficulty)
      if (filters.max_time) setMaxTime(filters.max_time)
    } finally {
      setProcessingVoice(false)
      setShowVoiceInput(false)
      setVoiceInputText('')
    }
  }

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      // iOS fallback: show text input
      setShowVoiceInput(true)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'he' ? 'he-IL' : 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    setListening(true)
    setVoiceText('')

    recognition.onresult = async (event: any) => {
      setListening(false)
      await applyVoiceFilters(event.results[0][0].transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  const filtered = recipes.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCourse = !courseFilter || r.course_type === courseFilter
    const matchDietary = !dietaryFilter || r.dietary_tags.includes(dietaryFilter as DietaryTag)
    const matchDifficulty = !difficultyFilter || r.difficulty === difficultyFilter
    const matchAuthor = !addedByFilter || r.added_by_name === addedByFilter
    const matchTime = !maxTime || (r.prep_time + r.cook_time) <= maxTime
    return matchSearch && matchCourse && matchDietary && matchDifficulty && matchAuthor && matchTime
  })

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <CookingAnimation />
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute top-3 text-gray-400" style={isRTL ? { right: 12 } : { left: 12 }} />
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={isRTL ? { paddingRight: 36, paddingLeft: 16 } : { paddingLeft: 36, paddingRight: 16 }}
            />
          </div>

          {/* Voice search button */}
          <button
            onClick={startVoiceSearch}
            disabled={listening}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              listening
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
                : 'border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500'
            }`}
            title="Voice search"
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
            {listening ? 'Listening...' : 'Voice'}
          </button>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg px-3 py-2 transition-colors">
              <X size={14} /> Clear filters
            </button>
          )}
          <span className="text-sm text-gray-400 ml-auto">{filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'}</span>
        </div>

        {/* iOS text input fallback */}
        {showVoiceInput && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-3">
            <p className="text-xs text-orange-600 mb-2 font-medium">
              🎤 Type your request — or use your keyboard's dictation button (🎤 on iPhone keyboard)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={voiceInputText}
                onChange={(e) => setVoiceInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && voiceInputText.trim() && applyVoiceFilters(voiceInputText)}
                placeholder={lang === 'he' ? 'לדוגמה: מתכון חלבי עד 30 דקות...' : 'e.g. dairy recipe under 30 minutes...'}
                autoFocus
                className="flex-1 border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <button
                onClick={() => voiceInputText.trim() && applyVoiceFilters(voiceInputText)}
                disabled={!voiceInputText.trim() || processingVoice}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {processingVoice ? '...' : 'Search'}
              </button>
              <button onClick={() => setShowVoiceInput(false)} className="text-gray-400 hover:text-gray-600 px-2">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Voice feedback */}
        {voiceText && (
          <div className="mb-4 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 flex items-center gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
            <Mic size={14} className="shrink-0" />
            <span>"{voiceText}"</span>
            {maxTime && <span className="text-orange-500 font-medium ml-2">⏱ max {maxTime} min</span>}
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-16">{t('loading')}</p>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">{t('noRecipes')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('title')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('courseType')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('dietaryTags')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('difficultyLabel')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('prepTime')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('ingredients')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('addedBy')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-gray-600">Video</th>
                    <th className="text-start px-4 py-3 font-semibold text-gray-600">{t('comments')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                  <tr className="border-b border-gray-200 bg-orange-50/40">
                    <td className="px-3 py-2">
                      <input type="text" placeholder="Filter..." value={search} onChange={(e) => setSearch(e.target.value)} className={selectClass} />
                    </td>
                    <td className="px-3 py-2">
                      <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectClass}>
                        <option value="">{t('allCategories')}</option>
                        {COURSE_TYPES.map((c) => <option key={c} value={c}>{t(c as any)}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={dietaryFilter} onChange={(e) => setDietaryFilter(e.target.value)} className={selectClass}>
                        <option value="">{t('allDietary')}</option>
                        {DIETARY_TAGS.map((d) => <option key={d} value={d}>{t(d as any)}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className={selectClass}>
                        <option value="">All</option>
                        {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(d as any)}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2">
                      <select value={addedByFilter} onChange={(e) => setAddedByFilter(e.target.value)} className={selectClass}>
                        <option value="">All</option>
                        {uniqueAuthors.map((name) => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-10 text-gray-400">{t('noRecipes')}</td></tr>
                  ) : filtered.map((recipe) => (
                    <tr key={recipe.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/recipes/${recipe.id}`} className="font-medium text-gray-900 hover:text-orange-500 transition-colors" dir={detectDir(recipe.title)}>
                          {recipe.title}
                        </Link>
                        {recipe.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-1" dir={detectDir(recipe.description)}>{recipe.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                          {t(recipe.course_type as any)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {recipe.dietary_tags.length > 0 ? recipe.dietary_tags.map((tag) => (
                            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${dietaryColor[tag] || 'bg-gray-100 text-gray-600'}`}>
                              {t(tag as any)}
                            </span>
                          )) : <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${difficultyColor[recipe.difficulty]}`}>
                          {t(recipe.difficulty as any)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-orange-400" />
                          {recipe.prep_time + recipe.cook_time} {t('minutes')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <IngredientsCell ingredients={recipe.ingredients || []} title={recipe.title} t={t} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{recipe.added_by_name}</td>
                      <td className="px-4 py-3">
                        {recipe.video_url ? (
                          <a href={recipe.video_url} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600 transition-colors" title="Watch video">
                            <PlayCircle size={20} />
                          </a>
                        ) : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setCommentsRecipe(recipe)}
                          className="flex items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors text-xs"
                          title={t('comments')}
                        >
                          <MessageCircle size={16} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {currentUser?.id === recipe.added_by && (
                          <button
                            onClick={() => setDeleteId(recipe.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            title={t('deleteRecipe')}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Comments modal */}
      {commentsRecipe && (
        <CommentsModal recipe={commentsRecipe} user={currentUser} t={t} onClose={() => setCommentsRecipe(null)} />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="text-gray-800 font-medium mb-4">{t('confirmDelete')}</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium">
                {t('yes')}
              </button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-50">
                {t('no')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

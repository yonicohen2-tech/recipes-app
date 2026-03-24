'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/context'
import Navbar from '@/components/Navbar'
import type { Recipe, Comment } from '@/lib/types'
import { detectDir } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import { Clock, ChefHat, User as UserIcon, ExternalLink, FileText, Trash2, Send, Download, Mail, MessageCircle } from 'lucide-react'

const difficultyColor = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
  } catch {}
  return null
}

export default function RecipeDetailPage() {
  const { t, isRTL } = useLang()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('recipes').select('*').eq('id', id).single(),
      supabase.from('comments').select('*').eq('recipe_id', id).order('created_at', { ascending: true }),
      supabase.auth.getUser(),
    ]).then(([{ data: recipeData }, { data: commentsData }, { data: userData }]) => {
      setRecipe(recipeData)
      setComments(commentsData || [])
      setUser(userData.user)
      setLoading(false)
    })
  }, [id])

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return
    setSubmitting(true)
    const supabase = createClient()
    const { data } = await supabase.from('comments').insert({
      recipe_id: id,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email,
      content: newComment.trim(),
    }).select().single()
    if (data) {
      setComments([...comments, data])
      setNewComment('')
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    const supabase = createClient()
    await supabase.from('recipes').delete().eq('id', id)
    router.push('/')
  }

  const isOwner = user && recipe && user.id === recipe.added_by

  if (loading) return <div dir={isRTL ? 'rtl' : 'ltr'}><Navbar /><p className="text-center py-16 text-gray-400">{t('loading')}</p></div>
  if (!recipe) return <div dir={isRTL ? 'rtl' : 'ltr'}><Navbar /><p className="text-center py-16 text-gray-400">Recipe not found</p></div>

  const embedUrl = recipe.video_url ? getYouTubeEmbedUrl(recipe.video_url) : null

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`mailto:?subject=${encodeURIComponent(recipe.title)}&body=${encodeURIComponent(
                  `${recipe.title}\n\n${recipe.description || ''}\n\n${t('ingredients')}:\n${(recipe.ingredients || []).map(i => `• ${i}`).join('\n')}\n\n${t('instructions')}:\n${recipe.instructions || ''}\n\nLink: ${typeof window !== 'undefined' ? window.location.href : ''}`
                )}`}
                className="text-gray-400 hover:text-blue-500 transition-colors"
                title="Send by email"
              >
                <Mail size={20} />
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `*${recipe.title}*\n\n${recipe.description || ''}\n\n*${t('ingredients')}:*\n${(recipe.ingredients || []).map(i => `• ${i}`).join('\n')}\n\n*${t('instructions')}:*\n${recipe.instructions || ''}\n\n${typeof window !== 'undefined' ? window.location.href : ''}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-600 transition-colors"
                title="Send on WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
              {isOwner && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title={t('deleteRecipe')}
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>

          {recipe.description && (
            <p className="text-gray-600 mb-4" dir={detectDir(recipe.description)}>{recipe.description}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full font-medium">
              {t(recipe.course_type as any)}
            </span>
            {recipe.dietary_tags.map((tag) => (
              <span key={tag} className="bg-blue-50 text-blue-600 text-sm px-3 py-1 rounded-full">
                {t(tag as any)}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5">{t('prepTime')}</p>
              <p className="font-semibold text-gray-800 flex items-center justify-center gap-1">
                <Clock size={14} className="text-orange-400" />
                {recipe.prep_time} {t('minutes')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5">{t('cookTime')}</p>
              <p className="font-semibold text-gray-800 flex items-center justify-center gap-1">
                <Clock size={14} className="text-orange-400" />
                {recipe.cook_time} {t('minutes')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5">{t('difficulty')}</p>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${difficultyColor[recipe.difficulty]}`}>
                {t(recipe.difficulty as any)}
              </span>
            </div>
            {recipe.servings && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Servings</p>
                <p className="font-semibold text-gray-800 text-sm">{recipe.servings}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5">{t('addedBy')}</p>
              <p className="font-semibold text-gray-800 flex items-center justify-center gap-1 text-sm">
                <UserIcon size={14} className="text-gray-400" />
                {recipe.added_by_name}
              </p>
            </div>
          </div>
        </div>

        {/* Ingredients + Instructions */}
        {(recipe.ingredients?.length > 0 || recipe.instructions) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipe.ingredients?.length > 0 && (
                <div>
                  <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                    {t('ingredients')}
                  </h2>
                  <ul className="space-y-2" dir={detectDir(recipe.ingredients[0])}>
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-orange-400 font-bold mt-0.5 shrink-0">•</span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recipe.instructions && (
                <div>
                  <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                    {t('instructions')}
                  </h2>
                  <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed" dir={detectDir(recipe.instructions)}>
                    {recipe.instructions}
                  </div>
                </div>
              )}
            </div>
            {recipe.notes && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  Tips & Notes
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed" dir={detectDir(recipe.notes)}>{recipe.notes}</p>
              </div>
            )}
            {recipe.file_url && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                  href={recipe.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-orange-500 text-sm transition-colors"
                >
                  <Download size={14} />
                  {t('downloadOriginal')}
                </a>
              </div>
            )}
          </div>
        )}

        {/* File viewer fallback (for recipes without extracted content) */}
        {!recipe.ingredients?.length && !recipe.instructions && recipe.file_url && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            {recipe.file_type?.startsWith('image/') ? (
              <img
                src={recipe.file_url}
                alt={recipe.title}
                className="w-full rounded-lg max-h-[600px] object-contain"
              />
            ) : (
              <a
                href={recipe.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-orange-500 hover:underline font-medium"
              >
                <FileText size={20} />
                {t('viewFile')}
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}

        {/* Video */}
        {recipe.video_url && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            {embedUrl ? (
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Recipe video"
                />
              </div>
            ) : (
              <a
                href={recipe.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-orange-500 hover:underline font-medium"
              >
                {t('watchVideo')} <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}

        {/* Comments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChefHat size={18} className="text-orange-400" />
            {t('comments')} ({comments.length})
          </h2>

          <div className="space-y-3 mb-4">
            {comments.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">{c.user_name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder={t('addComment')}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Send size={14} />
                {t('submitComment')}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              <a href="/login" className="text-orange-500 hover:underline">{t('signIn')}</a> {t('noAccount')}
            </p>
          )}
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <p className="text-gray-800 font-medium mb-4">{t('confirmDelete')}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium"
                >
                  {t('yes')}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-50"
                >
                  {t('no')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

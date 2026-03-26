'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/context'
import Navbar from '@/components/Navbar'
import type { Recipe, CourseType, DietaryTag } from '@/lib/types'
import { Clock, ChefHat, Check, X, UtensilsCrossed, MessageCircle, ShoppingCart } from 'lucide-react'

const COURSE_ORDER: CourseType[] = [
  'appetizer',
  'first-course',
  'main-course',
  'side-dish',
  'dessert',
  'drink',
  'snack',
]

type SectionKey = DietaryTag | CourseType

interface Section {
  key: SectionKey
  match: (r: Recipe) => boolean
}

const tags = (r: Recipe) => r.dietary_tags || []

const SECTIONS: Section[] = [
  { key: 'fish',        match: (r) => tags(r).includes('fish') },
  { key: 'meat',        match: (r) => tags(r).includes('meat') && !tags(r).includes('fish') },
  { key: 'side-dish',   match: (r) => r.course_type === 'side-dish' && !tags(r).includes('fish') && !tags(r).includes('meat') },
  { key: 'appetizer',   match: (r) => r.course_type === 'appetizer' },
  { key: 'first-course',match: (r) => r.course_type === 'first-course' },
  { key: 'main-course', match: (r) => r.course_type === 'main-course' && !tags(r).includes('fish') && !tags(r).includes('meat') },
  { key: 'dessert',     match: (r) => r.course_type === 'dessert' },
  { key: 'drink',       match: (r) => r.course_type === 'drink' },
  { key: 'snack',       match: (r) => r.course_type === 'snack' },
]

const SECTION_DOT: Partial<Record<SectionKey, string>> = {
  fish: 'bg-blue-400',
  meat: 'bg-red-400',
  'side-dish': 'bg-green-400',
}

const SECTION_TEXT: Partial<Record<SectionKey, string>> = {
  fish: 'text-blue-500',
  meat: 'text-red-500',
  'side-dish': 'text-green-600',
}

const difficultyColor = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export default function MenuPlannerPage() {
  const { t, isRTL } = useLang()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('recipes')
      .select('*')
      .order('title', { ascending: true })
      .then(({ data }) => {
        setRecipes(data || [])
        setLoading(false)
      })
  }, [])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setCheckedIngredients(new Set())
  }

  // Assign each recipe to its first matching section (no duplicates)
  const assignedIds = new Set<string>()
  const sectionRecipes: Record<string, Recipe[]> = {}
  for (const section of SECTIONS) {
    sectionRecipes[section.key] = recipes.filter((r) => {
      if (assignedIds.has(r.id)) return false
      if (section.match(r)) { assignedIds.add(r.id); return true }
      return false
    })
  }

  const selectedRecipes = recipes.filter((r) => selected.has(r.id))

  const totalTime = selectedRecipes.reduce((sum, r) => sum + r.prep_time + r.cook_time, 0)

  const allIngredients = selectedRecipes.flatMap((r) =>
    (r.ingredients || []).map((ing) => ({ ingredient: ing, recipe: r.title }))
  )

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('menuPlanner')}</h1>
        <p className="text-gray-500 text-sm mb-6">{t('pickRecipes')}</p>

        {loading ? (
          <p className="text-center text-gray-400 py-16">{t('loading')}</p>
        ) : (
          <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left: category picker */}
            <div className="flex-1 space-y-6">
              {SECTIONS.map((section) => {
                const courseRecipes = sectionRecipes[section.key] || []
                if (courseRecipes.length === 0) return null
                const dotColor = SECTION_DOT[section.key] || 'bg-orange-400'
                return (
                  <div key={section.key}>
                    <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor} inline-block`} />
                      {t(section.key as any)}
                      <span className="text-xs text-gray-400 font-normal">({courseRecipes.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {courseRecipes.map((recipe) => {
                        const isSelected = selected.has(recipe.id)
                        return (
                          <button
                            key={recipe.id}
                            onClick={() => toggle(recipe.id)}
                            className={`text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                              isSelected
                                ? 'border-orange-400 bg-orange-50 shadow-sm'
                                : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-gray-900 text-sm leading-snug">{recipe.title}</span>
                              <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                              }`}>
                                {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                              </span>
                            </div>
                            {recipe.description && (
                              <p className="text-gray-500 text-xs mt-1 line-clamp-1">{recipe.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={11} />
                                {recipe.prep_time + recipe.cook_time} {t('minutes')}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[recipe.difficulty]}`}>
                                {t(recipe.difficulty as any)}
                              </span>
                              {(recipe.dietary_tags || []).slice(0, 2).map((tag) => (
                                <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                  {t(tag as any)}
                                </span>
                              ))}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right: selected menu summary */}
            <div className="lg:w-80 shrink-0">
              <div className="sticky top-20">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                      <UtensilsCrossed size={18} className="text-orange-500" />
                      {t('yourMenu')}
                    </h2>
                    {selected.size > 0 && (
                      <button
                        onClick={() => setSelected(new Set())}
                        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                      >
                        <X size={13} />
                        {t('clearMenu')}
                      </button>
                    )}
                  </div>

                  {selectedRecipes.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <ChefHat size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">{t('menuEmpty')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {SECTIONS.map((section) => {
                        const items = (sectionRecipes[section.key] || []).filter((r) => selected.has(r.id))
                        if (items.length === 0) return null
                        const textColor = SECTION_TEXT[section.key] || 'text-orange-500'
                        return (
                          <div key={section.key} className="px-5 py-3">
                            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textColor}`}>
                              {t(section.key as any)}
                            </p>
                            {items.map((recipe) => (
                              <div key={recipe.id} className="flex items-center justify-between gap-2 py-1.5">
                                <Link
                                  href={`/recipes/${recipe.id}`}
                                  className="text-sm text-gray-800 hover:text-orange-500 font-medium transition-colors line-clamp-1"
                                >
                                  {recipe.title}
                                </Link>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {recipe.prep_time + recipe.cook_time}{t('minutes')}
                                  </span>
                                  <button
                                    onClick={() => toggle(recipe.id)}
                                    className="text-gray-300 hover:text-red-400 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })}

                      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">{t('totalTime')}</span>
                        <span className="text-sm font-bold text-orange-500 flex items-center gap-1">
                          <Clock size={14} />
                          {totalTime} {t('minutes')}
                        </span>
                      </div>

                      <div className="px-5 py-3">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `🍽️ ${t('yourMenu')}\n\n` +
                            SECTIONS.flatMap((section) => {
                              const items = (sectionRecipes[section.key] || []).filter((r) => selected.has(r.id))
                              if (items.length === 0) return []
                              return [
                                `*${t(section.key as any)}*`,
                                ...items.map((r) => {
                                  let line = `• ${r.title} (${r.prep_time + r.cook_time} ${t('minutes')})`
                                  if (r.ingredients?.length) {
                                    line += `\n  ${r.ingredients.map(i => `- ${i}`).join('\n  ')}`
                                  }
                                  return line
                                }),
                                ''
                              ]
                            }).join('\n') +
                            `⏱️ ${t('totalTime')}: ${totalTime} ${t('minutes')}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                        >
                          <MessageCircle size={16} />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Shopping list — full width, always visible when recipes are selected */}
          {selectedRecipes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-orange-500" />
                  {t('shoppingList')}
                  {allIngredients.length > 0 && (
                    <span className="text-xs font-normal text-gray-400">
                      ({allIngredients.length - checkedIngredients.size} {t('ingredients')} left)
                    </span>
                  )}
                </h2>
                {checkedIngredients.size > 0 && (
                  <button onClick={() => setCheckedIngredients(new Set())} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                    Reset
                  </button>
                )}
              </div>
              <div className="p-5">
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mb-4">
                  {allIngredients.map(({ ingredient }, i) => {
                    const have = checkedIngredients.has(i)
                    return (
                      <li
                        key={i}
                        className="flex items-start gap-2 cursor-pointer group"
                        onClick={() => setCheckedIngredients((prev) => {
                          const next = new Set(prev)
                          have ? next.delete(i) : next.add(i)
                          return next
                        })}
                      >
                        <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${have ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-orange-400'}`}>
                          {have && <Check size={10} className="text-white" strokeWidth={3} />}
                        </span>
                        <span className={`text-sm transition-colors ${have ? 'line-through text-gray-300' : 'text-gray-700'}`} dir="auto">
                          {ingredient}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                {allIngredients.length === 0 && (
                  <p className="text-sm text-gray-400">{t('noIngredientsList')}</p>
                )}
                {allIngredients.some((_, i) => !checkedIngredients.has(i)) && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `🛒 ${t('shoppingList')}\n\n` +
                      allIngredients
                        .filter((_, i) => !checkedIngredients.has(i))
                        .map(({ ingredient }) => `• ${ingredient}`)
                        .join('\n')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                  >
                    <MessageCircle size={16} />
                    Send shopping list to WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
          </div>
        )}
      </main>
    </div>
  )
}

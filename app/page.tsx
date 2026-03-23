'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/context'
import Navbar from '@/components/Navbar'
import type { Recipe, CourseType, DietaryTag } from '@/lib/types'
import { Search, SlidersHorizontal, Clock, ChefHat } from 'lucide-react'

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

function IngredientsCell({ ingredients, t }: { ingredients: string[], t: (k: any) => string }) {
  const [open, setOpen] = useState(false)
  if (!ingredients || ingredients.length === 0) return <span className="text-gray-300">—</span>

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-orange-500 hover:text-orange-600 text-sm font-medium underline decoration-dotted"
      >
        {ingredients.length} {t('ingredients')}
      </button>
      {open && (
        <div className="absolute z-50 bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-56 text-sm">
          <p className="font-semibold text-gray-700 mb-2">{t('ingredients')}</p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {ingredients.map((ing, i) => (
              <li key={i} className="text-gray-600 flex items-start gap-1.5">
                <span className="text-orange-400 mt-1 shrink-0">•</span>
                {ing}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const { t, isRTL } = useLang()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<CourseType | ''>('')
  const [dietaryFilter, setDietaryFilter] = useState<DietaryTag | ''>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRecipes(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = recipes.filter((r) => {
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCourse = !courseFilter || r.course_type === courseFilter
    const matchDietary = !dietaryFilter || r.dietary_tags.includes(dietaryFilter)
    const matchDifficulty = !difficultyFilter || r.difficulty === difficultyFilter
    return matchSearch && matchCourse && matchDietary && matchDifficulty
  })

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search + filters bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <SlidersHorizontal size={16} />
            {t('filters')}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('courseType')}</label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value as CourseType | '')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">{t('allCategories')}</option>
                {COURSE_TYPES.map((c) => <option key={c} value={c}>{t(c as any)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('dietaryTags')}</label>
              <select
                value={dietaryFilter}
                onChange={(e) => setDietaryFilter(e.target.value as DietaryTag | '')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">{t('allDietary')}</option>
                {DIETARY_TAGS.map((d) => <option key={d} value={d}>{t(d as any)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('difficultyLabel')}</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">{t('allDietary')}</option>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(d as any)}</option>)}
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-16">{t('loading')}</p>
        ) : filtered.length === 0 ? (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((recipe) => (
                    <tr key={recipe.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/recipes/${recipe.id}`} className="font-medium text-gray-900 hover:text-orange-500 transition-colors">
                          {recipe.title}
                        </Link>
                        {recipe.description && (
                          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{recipe.description}</p>
                        )}
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
                        <IngredientsCell ingredients={recipe.ingredients || []} t={t} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {recipe.added_by_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

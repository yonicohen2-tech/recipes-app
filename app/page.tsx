'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/context'
import Navbar from '@/components/Navbar'
import RecipeCard from '@/components/RecipeCard'
import type { Recipe, CourseType, DietaryTag } from '@/lib/types'
import { Search, SlidersHorizontal } from 'lucide-react'

const COURSE_TYPES: CourseType[] = ['appetizer', 'first-course', 'main-course', 'side-dish', 'dessert', 'drink', 'snack']
const DIETARY_TAGS: DietaryTag[] = ['dairy', 'non-dairy', 'gluten-free', 'vegan', 'vegetarian', 'meat']
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

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
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute top-3 text-gray-400" style={isRTL ? {right:12} : {left:12}} />
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={isRTL ? {paddingRight: 36, paddingLeft: 16} : {paddingLeft: 36, paddingRight: 16}}
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
          <p className="text-center text-gray-400 py-16">{t('noRecipes')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        )}
      </main>
    </div>
  )
}

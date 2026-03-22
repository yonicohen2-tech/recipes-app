'use client'

import Link from 'next/link'
import { useLang } from '@/lib/context'
import { Clock, ChefHat, User } from 'lucide-react'
import type { Recipe } from '@/lib/types'

const difficultyColor = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { t, isRTL } = useLang()

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* File type badge / thumbnail area */}
        <div className="h-32 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
          <ChefHat size={48} className="text-orange-300" />
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-1">{recipe.title}</h3>
          {recipe.description && (
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{recipe.description}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
              {t(recipe.course_type as any)}
            </span>
            {recipe.dietary_tags.map((tag) => (
              <span key={tag} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                {t(tag as any)}
              </span>
            ))}
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {recipe.prep_time + recipe.cook_time} {t('minutes')}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor[recipe.difficulty]}`}>
                {t(recipe.difficulty as any)}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <User size={12} />
              {recipe.added_by_name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

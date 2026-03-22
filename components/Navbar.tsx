'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/context'
import { createClient } from '@/lib/supabase/client'
import { ChefHat, PlusCircle, LogOut, LogIn, CalendarDays } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const { t, lang, setLang, isRTL } = useLang()
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between" dir={isRTL ? 'rtl' : 'ltr'}>
        <Link href="/" className="flex items-center gap-2 text-orange-500 font-bold text-lg">
          <ChefHat size={24} />
          <span>{t('appName')}</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
            className="text-sm px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 font-medium"
          >
            {lang === 'en' ? 'עב' : 'EN'}
          </button>

          {user ? (
            <>
              <Link
                href="/menu"
                className="flex items-center gap-1 text-gray-600 hover:text-orange-500 text-sm font-medium transition-colors"
              >
                <CalendarDays size={16} />
                <span className="hidden sm:inline">{t('menuPlanner')}</span>
              </Link>
              <Link
                href="/recipes/add"
                className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                <PlusCircle size={16} />
                <span className="hidden sm:inline">{t('addRecipe')}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              <LogIn size={16} />
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

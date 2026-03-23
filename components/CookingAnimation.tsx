'use client'

import { useEffect, useState } from 'react'

const FOOD_ITEMS = ['🍳', '🥘', '🍕', '🥗', '🍰', '🥩', '🥕', '🧁', '🍜', '🥞', '🫕', '🧆']

function FloatingFood({ emoji, style }: { emoji: string, style: React.CSSProperties }) {
  return (
    <span
      className="absolute text-2xl select-none pointer-events-none"
      style={{ animation: 'float 3s ease-in-out infinite', ...style }}
    >
      {emoji}
    </span>
  )
}

export default function CookingAnimation() {
  const [items, setItems] = useState<{ emoji: string, left: number, delay: number, duration: number, top: number }[]>([])

  useEffect(() => {
    setItems(
      FOOD_ITEMS.map((emoji, i) => ({
        emoji,
        left: (i / FOOD_ITEMS.length) * 90 + 2,
        delay: i * 0.3,
        duration: 2.5 + (i % 4) * 0.5,
        top: 15 + (i % 3) * 22,
      }))
    )
  }, [])

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes bounce-chef {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes steam {
          0% { opacity: 0; transform: translateY(0) scaleX(1); }
          50% { opacity: 0.6; transform: translateY(-10px) scaleX(1.2); }
          100% { opacity: 0; transform: translateY(-20px) scaleX(0.8); }
        }
      `}</style>

      <div className="relative w-full bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-2xl border border-orange-100 mb-6 overflow-hidden" style={{ height: 110 }}>

        {/* Floating food items */}
        {items.map((item, i) => (
          <FloatingFood
            key={i}
            emoji={item.emoji}
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
              opacity: 0.85,
            }}
          />
        ))}

        {/* Chef character (SVG) */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col items-center" style={{ animation: 'bounce-chef 2s ease-in-out infinite' }}>
          {/* Steam from pot */}
          <div className="flex gap-2 mb-0.5">
            {[0, 0.3, 0.6].map((d, i) => (
              <div key={i} className="w-1 h-4 rounded-full bg-orange-200" style={{ animation: `steam 1.5s ease-in-out infinite`, animationDelay: `${d}s` }} />
            ))}
          </div>
          {/* SVG chef */}
          <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Chef hat */}
            <ellipse cx="32" cy="22" rx="14" ry="5" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
            <rect x="20" y="8" width="24" height="16" rx="4" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
            <ellipse cx="32" cy="8" rx="8" ry="6" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
            {/* Face */}
            <circle cx="32" cy="34" r="12" fill="#FBBF24"/>
            {/* Eyes */}
            <circle cx="27" cy="32" r="2" fill="#1f2937"/>
            <circle cx="37" cy="32" r="2" fill="#1f2937"/>
            {/* Eye shine */}
            <circle cx="28" cy="31" r="0.8" fill="white"/>
            <circle cx="38" cy="31" r="0.8" fill="white"/>
            {/* Smile */}
            <path d="M26 38 Q32 43 38 38" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            {/* Rosy cheeks */}
            <circle cx="23" cy="36" r="3" fill="#FCA5A5" opacity="0.5"/>
            <circle cx="41" cy="36" r="3" fill="#FCA5A5" opacity="0.5"/>
            {/* Body */}
            <rect x="20" y="46" width="24" height="18" rx="4" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
            {/* Buttons */}
            <circle cx="32" cy="52" r="1.5" fill="#f97316"/>
            <circle cx="32" cy="58" r="1.5" fill="#f97316"/>
            {/* Arms */}
            <path d="M20 50 Q10 52 8 58" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round"/>
            <path d="M44 50 Q54 52 56 58" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round"/>
            {/* Pot in left hand */}
            <ellipse cx="6" cy="60" rx="6" ry="4" fill="#9ca3af" stroke="#6b7280" strokeWidth="1"/>
            <rect x="1" y="57" width="10" height="5" rx="2" fill="#9ca3af" stroke="#6b7280" strokeWidth="1"/>
            {/* Spoon in right hand */}
            <line x1="56" y1="58" x2="60" y2="50" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"/>
            <ellipse cx="60" cy="49" rx="2.5" ry="2" fill="#d97706"/>
          </svg>
        </div>

        {/* Title text */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
          <p className="text-orange-400 font-bold text-lg tracking-wide" style={{ animation: 'wiggle 3s ease-in-out infinite', display: 'inline-block' }}>
            👨‍👩‍👧‍👦 Family Recipes
          </p>
          <p className="text-orange-300 text-xs font-medium hidden sm:block">Cook together, eat together ❤️</p>
        </div>
      </div>
    </>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const navigation = [
  { name: 'Postavke', href: '/user' },
  { name: 'Galerija', href: '/galerija' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Swipe handlers
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      setTouchEnd(null)
      setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return
      
      const distance = touchStart - touchEnd
      const isLeftSwipe = distance > minSwipeDistance
      const isRightSwipe = distance < -minSwipeDistance

      // Swipe from left edge to open
      if (isRightSwipe && touchStart < 50 && !isMobileMenuOpen) {
        setIsMobileMenuOpen(true)
      }
      // Swipe left to close
      if (isLeftSwipe && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    // Only add touch listeners on mobile
    if (window.innerWidth < 1024) {
      document.addEventListener('touchstart', onTouchStart)
      document.addEventListener('touchmove', onTouchMove)
      document.addEventListener('touchend', onTouchEnd)
    }

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [touchStart, touchEnd, isMobileMenuOpen])

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
        {/* Logo/Brand Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400">
              <Image
                src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                alt="Wedding logo"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Vaše Vjenčanje
              </h2>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonBox: "flex items-center gap-3",
                userButtonTrigger: "flex flex-row items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors w-full",
                userButtonAvatarBox: "w-10 h-10 order-first",
                userButtonOuterIdentifier: "order-last text-gray-700 text-sm font-medium"
              }
            }}
            showName={true}
          />
        </div>
      </div>
    </aside>
    </>
  )
}


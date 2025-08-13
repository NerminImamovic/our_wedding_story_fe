'use client'

import React from 'react'
import WeddingForm from './WeddingForm'
import QRCodeGenerator from './QRCodeGenerator'
import AuthorizeButton from './AuthorizeButton'
import { UserProvider } from './UserContext'
import { UserButton } from '@clerk/nextjs'

export default function UserPage() {
  return (
    <UserProvider>
      <div className="min-h-screen bg-white font-serif relative overflow-hidden">
        {/* Decorative elements matching [slug] page */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-50"></div>
        <div className="absolute top-20 right-10 w-40 h-40 border border-gold-200 rounded-full opacity-10"></div>
        <div className="absolute bottom-20 left-10 w-60 h-60 border border-gold-200 rounded-full opacity-10"></div>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 border border-gold-200 rounded-full opacity-10"></div>
        
        {/* User button positioned absolutely */}
        <div className="absolute top-4 right-4 z-10">
          <UserButton />
        </div>
        
        {/* Main content container */}
        <div className="max-w-7xl mx-auto px-4 py-8 pt-20">
          {/* Page header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 w-full mb-6">
              <div className="h-px bg-gradient-to-r from-white via-gold-300 to-white flex-grow max-w-xs"></div>
              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gold-400">
                <path d="M32 8L35.3301 18H28.6699L32 8Z" fill="currentColor" />
                <path d="M32 8L35.3301 18H28.6699L32 8Z" fill="currentColor" transform="rotate(72 32 32)" />
                <path d="M32 8L35.3301 18H28.6699L32 8Z" fill="currentColor" transform="rotate(144 32 32)" />
                <path d="M32 8L35.3301 18H28.6699L32 8Z" fill="currentColor" transform="rotate(216 32 32)" />
                <path d="M32 8L35.3301 18H28.6699L32 8Z" fill="currentColor" transform="rotate(288 32 32)" />
                <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.2" />
                <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.4" />
              </svg>
              <div className="h-px bg-gradient-to-r from-white via-gold-300 to-white flex-grow max-w-xs"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-gray-800 mb-4 tracking-wider" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Prilagodba Vjenčanja
            </h1>
            <p className="text-gray-600 text-lg font-light italic">Prilagodite svoj poseban dan</p>
          </div>

          {/* Wedding Form Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-xl shadow-lg p-8 overflow-hidden border border-gold-100 relative"
                 style={{
                   backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.03), rgba(255, 255, 255, 0) 70%)'
                 }}>
              {/* Gold corner accents */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-gold-200"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-gold-200"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-gold-200"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-gold-200"></div>
              
              <h2 className="text-3xl font-light text-gray-800 mb-6 text-center tracking-wide">Podaci o Vjenčanju</h2>
              <WeddingForm />
            </div>
          </div>

          {/* Authorization Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-xl shadow-lg p-8 overflow-hidden border border-gold-100 relative"
                 style={{
                   backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.03), rgba(255, 255, 255, 0) 70%)'
                 }}>
              {/* Gold corner accents */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-gold-200"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-gold-200"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-gold-200"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-gold-200"></div>
              
              <h2 className="text-3xl font-light text-gray-800 mb-6 text-center tracking-wide">Autorizacija</h2>
              <AuthorizeButton />
            </div>
          </div>

          {/* QR Code Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-xl shadow-lg p-8 overflow-hidden border border-gold-100 relative"
                 style={{
                   backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.03), rgba(255, 255, 255, 0) 70%)'
                 }}>
              {/* Gold corner accents */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-gold-200"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-gold-200"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-gold-200"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-gold-200"></div>
              
              <h2 className="text-3xl font-light text-gray-800 mb-6 text-center tracking-wide">Generator QR Koda</h2>
              <QRCodeGenerator />
            </div>
          </div>

          {/* Footer decorative element */}
          <div className="text-center mt-16">
            <div className="flex items-center justify-center gap-4 w-full mb-3">
              <div className="h-px bg-gradient-to-r from-white via-gold-200 to-white flex-grow max-w-xs"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gold-300">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" opacity="0.5" />
              </svg>
              <div className="h-px bg-gradient-to-r from-white via-gold-200 to-white flex-grow max-w-xs"></div>
            </div>
            <p className="text-gray-500 text-sm italic">Kreirajte svoje savršeno iskustvo vjenčanja</p>
          </div>
        </div>
      </div>
    </UserProvider>
  )
} 

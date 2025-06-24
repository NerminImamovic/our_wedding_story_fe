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
      <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 dark:from-purple-800 dark:via-pink-800 dark:to-red-800 flex items-center flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 gap-y-12">
        <div className="absolute top-4 right-4">
          <UserButton />
        </div>
        
        <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 text-center">Podaci o vjenčanju</h2>
          <WeddingForm />
        </div>

        <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <AuthorizeButton />
        </div>

        <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <QRCodeGenerator />
        </div>
      </div>
    </UserProvider>
  )
} 

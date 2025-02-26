 
'use client'

import React, { useState } from 'react'
import WeddingForm from './WeddingForm'
import QRCodeGenerator from './QRCodeGenerator'
import AuthorizeButton from './AuthorizeButton'

export default function UserPage() {
  const [slug, setSlug] = useState('')

  const handleFormSubmit = (newSlug: string) => {
    setSlug(newSlug)
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 gap-y-12">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">Podaci o vjenčanju</h2>
        <WeddingForm onFormSubmit={handleFormSubmit} />
      </div>

      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        {/* <h2 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">Wedding Details</h2> */}
        <AuthorizeButton disabled={false} email="nimamovic9@gmail.com" />
      </div>

      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        {/* <h1 className="text-3xl font-bold text-pink-700 mb-6">QR Code Generator</h1> */}
        <QRCodeGenerator disabled={false} slug={slug} />
      </div>
    </div>
  )
} 

'use client'

import React, { useEffect, useState } from 'react'
import UploadComponent from './UploadComponent'
import { useParams } from 'next/navigation'
import { getOrCreateUserId } from '@/utils/localStorage'

export default function Home() {
  const { slug } = useParams() as { slug: string }
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    setUserId(getOrCreateUserId())
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-12">
        <UploadComponent slug={slug} userId={userId} />
      </div>
    </div>
  )
}

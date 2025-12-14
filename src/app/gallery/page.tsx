'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { getAllImages } from '@/api/apiClient'
import { useAuth } from '@clerk/nextjs'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { toast, Toaster } from 'react-hot-toast'
import JSZip from 'jszip'

interface ImageItem {
  key: string
  presignedUrl: string
  fileName: string
  expiresIn: number
}

interface PaginationData {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function GalerijaPage() {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(20)
  const [isExporting, setIsExporting] = useState(false)
  const { getToken } = useAuth()

  const { data, error, isLoading } = useQuery({
    queryKey: ['allImages', currentPage, limit],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')
      return getAllImages(token, currentPage, limit)
    },
  })

  const displayImages: ImageItem[] = data?.images || []
  const pagination: PaginationData | null = data?.pagination || null

  // Download image with error handling (similar to ImageGalleryComponent)
  const downloadImage = async (image: ImageItem, index: number): Promise<{ blob: Blob; filename: string } | null> => {
    try {
      console.log(`📥 Downloading: ${image.fileName}`)
      
      const response = await fetch(image.presignedUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const filename = image.fileName || `image_${index + 1}.jpg`
      
      console.log(`✅ Download successful: ${image.fileName}`)
      return { blob, filename }
      
    } catch (error) {
      console.error(`❌ Download failed for: ${image.fileName}`, error)
      return null
    }
  }

  const exportAllAsZip = async () => {
    if (!pagination) return

    setIsExporting(true)
    const zip = new JSZip()

    try {
      const token = await getToken()
      if (!token) throw new Error('No auth token')

      // Fetch all pages
      const totalPages = pagination.totalPages
      const allImages: ImageItem[] = []

      // Show progress toast
      const progressToast = toast.loading(`Preuzimanje liste slika...`)

      // Fetch all pages
      for (let page = 1; page <= totalPages; page++) {
        toast.loading(`Učitavanje stranice ${page} od ${totalPages}...`, {
          id: progressToast,
        })
        const result = await getAllImages(token, page, 100) // Use max limit
        allImages.push(...result.images)
      }

      toast.loading(`Preuzimanje ${allImages.length} slika...`, {
        id: progressToast,
      })

      // Download all images in batches to avoid overwhelming the browser
      const batchSize = 5
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < allImages.length; i += batchSize) {
        const batch = allImages.slice(i, Math.min(i + batchSize, allImages.length))
        
        // Download batch in parallel
        const results = await Promise.all(
          batch.map((image, batchIndex) => downloadImage(image, i + batchIndex))
        )

        // Add successful downloads to ZIP
        results.forEach((result) => {
          if (result) {
            zip.file(result.filename, result.blob)
            successCount++
          } else {
            failCount++
          }
        })

        // Update progress
        const totalProcessed = Math.min(i + batchSize, allImages.length)
        toast.loading(
          `Preuzimanje slika: ${totalProcessed}/${allImages.length}...`,
          { id: progressToast }
        )
      }

      if (successCount === 0) {
        throw new Error('Nijedna slika nije uspješno preuzeta')
      }

      // Generate and download ZIP
      toast.loading('Kreiranje ZIP fajla...', { id: progressToast })
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })

      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `galerija_sve_slike_${new Date().getTime()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      const message = failCount > 0 
        ? `Exportovano ${successCount} slika (${failCount} neuspješno)`
        : `Uspješno exportovano ${successCount} slika!`
      
      toast.success(message, { id: progressToast, duration: 5000 })
      
    } catch (error) {
      console.error('Error exporting images:', error)
      toast.error('Greška pri exportovanju slika. Molimo pokušajte ponovo.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="w-full h-64 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-purple-600 border-t-3 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600">Učitavanje slika...</p>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="w-full p-6 bg-red-50 rounded-lg text-center">
          <p className="text-red-600">Greška pri učitavanju slika</p>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (!displayImages || displayImages.length === 0) {
    return (
      <AuthenticatedLayout>
        <div className="w-full p-8 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500">Nema uploadovanih slika</p>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#4A4A4A',
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#8B5CF6',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Galerija</h1>
              <p className="text-gray-600">
                {pagination 
                  ? `Ukupno ${pagination.totalCount} slika - Stranica ${pagination.page} od ${pagination.totalPages}`
                  : 'Sve uploadovane slike'
                }
              </p>
            </div>
            
            {/* Export All Button */}
            {pagination && pagination.totalCount > 0 && (
              <button
                onClick={exportAllAsZip}
                disabled={isExporting}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exportovanje...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Preuzmi sve ({pagination.totalCount})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayImages.map((image: ImageItem) => (
            <motion.div
              key={image.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square group overflow-hidden rounded-lg shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <Image
                src={image.presignedUrl}
                alt={image.fileName}
                fill
                unoptimized={true}
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs text-white truncate block">{image.fileName}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              « Prethodna
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, last page, current page, and pages around current
                  return (
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - pagination.page) <= 1
                  )
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const prevPage = array[index - 1]
                  const showEllipsis = prevPage && page - prevPage > 1

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showEllipsis && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          page === pagination.page
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  )
                })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Sljedeća »
            </button>
            <button
              onClick={() => setCurrentPage(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              »»
            </button>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                <Image
                  src={selectedImage.presignedUrl}
                  alt={selectedImage.fileName}
                  width={1200}
                  height={800}
                  unoptimized={true}
                  className="object-contain max-h-[80vh] w-full"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all"
                  aria-label="Close preview"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="p-4 bg-white border-t">
                <h3 className="text-lg font-medium text-gray-800">{selectedImage.fileName}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthenticatedLayout>
  )
}


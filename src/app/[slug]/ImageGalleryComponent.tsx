'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { deleteUserImage, getUserImages } from '@/api/apiClient'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast, Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { captureException } from '@sentry/nextjs'

interface ImageItem {
  key: string
  presignedUrl: string
  expiresAt: string
}

export default function ImageGalleryComponent({ slug, userId }: { slug: string, userId: string }) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const queryClient = useQueryClient()

    const { data, error, isLoading } = useQuery({
      queryKey: ['userImages', slug, userId],
      queryFn: () => getUserImages({ slug, userId }),
      enabled: !!userId,  
    })

  const deleteImageMutation = useMutation({
    mutationFn: (imageKey: string) => deleteUserImage({ imageKey, bearerToken: '' }),
    onSuccess: () => {
      toast.success('Image deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['userImages', slug, userId] })
      setSelectedImage(null)
    },
    onError: (error) => {
      captureException(error)
      toast.error('Failed to delete image')
    }
  })

  const handleDeleteImage = useCallback((image: ImageItem) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteImageMutation.mutate(image.key)
    }
  }, [deleteImageMutation])

  const openImagePreview = useCallback((image: ImageItem) => {
    setSelectedImage(image)
  }, [])

  const closeImagePreview = useCallback(() => {
    setSelectedImage(null)
  }, [])

  // Use mock images instead of API data for now
  const displayImages = data?.images || []

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-gold-300 border-t-3 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">Loading your images...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 rounded-lg text-center">
        <p className="text-red-600">Error loading images</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['userImages', slug, userId] })}
          className="mt-2 px-4 py-1 bg-white text-red-600 rounded-full shadow-sm hover:shadow border border-red-200"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!displayImages || displayImages.length === 0) {
    return (
      <div className="bg-white p-4 md:p-8 font-serif relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-50"></div>
        <div className="absolute top-20 right-10 w-40 h-40 border border-gold-200 rounded-full opacity-10"></div>
        <div className="absolute bottom-20 left-10 w-60 h-60 border border-gold-200 rounded-full opacity-10"></div>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 border border-gold-200 rounded-full opacity-10"></div>
        
        <div className="w-full p-8 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500">No images uploaded yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 md:p-8 font-serif relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-50"></div>
      <div className="absolute top-20 right-10 w-40 h-40 border border-gold-200 rounded-full opacity-10"></div>
      <div className="absolute bottom-20 left-10 w-60 h-60 border border-gold-200 rounded-full opacity-10"></div>
      <div className="absolute top-1/3 left-1/4 w-32 h-32 border border-gold-200 rounded-full opacity-10"></div>
      
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#4A4A4A',
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            fontFamily: 'serif'
          },
          success: {
            iconTheme: {
              primary: '#D4AF37',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#D4846A',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-4">Your Gallery</h2>
          <div className="w-24 h-0.5 bg-gold-300 mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayImages.map((image: ImageItem) => (
            <motion.div 
              key={image.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square group overflow-hidden rounded-xl shadow-sm border border-gold-100 hover:shadow-md transition-all duration-300"
            >
              <div className="absolute inset-0 border border-gold-200 rounded-xl m-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
              <div className="relative w-full h-full">
                <Image
                  src={image.presignedUrl}
                  unoptimized={true}
                  alt={'Uploaded image'}
                  fill
                  className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-700"
                  onClick={() => openImagePreview(image)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs text-white truncate max-w-[70%]">{image.presignedUrl || 'Image'}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteImage(image)
                    }}
                    className="p-1.5 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 rounded-full transition-colors"
                    aria-label="Delete image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeImagePreview}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                <Image
                  src={selectedImage.presignedUrl}
                  alt={'Uploaded image'}
                  width={800}
                  height={600}
                  className="object-contain max-h-[80vh]"
                />
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button 
                    onClick={closeImagePreview}
                    className="p-2 bg-white/90 text-gray-600 hover:text-gray-900 rounded-full shadow-lg"
                    aria-label="Close preview"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteImage(selectedImage)}
                    className="p-2 bg-white/90 text-red-500 hover:text-red-700 rounded-full shadow-lg"
                    aria-label="Delete image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4 bg-white">
                <h3 className="text-lg font-medium text-gray-800 truncate">{selectedImage.presignedUrl || 'Image'}</h3>
                <p className="text-sm text-gray-500">
                  Uploaded: {new Date(selectedImage.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 

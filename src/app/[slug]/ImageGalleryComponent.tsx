'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { deleteUserImage, getUserImages } from '@/api/apiClient'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast, Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { captureException } from '@sentry/nextjs'
import JSZip from 'jszip'
import { downloadImageAction, getImageDownloadUrlAction } from '@/app/actions/downloadImages'

interface ImageItem {
  key: string
  presignedUrl: string
  expiresAt: string
}

export default function ImageGalleryComponent({ slug, userId }: { slug: string, userId: string }) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
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

  // Use API data
  const displayImages = data?.images || []

  // Download image using Server Actions (no CORS issues!)
  const downloadImageViaServerAction = async (image: ImageItem): Promise<Blob> => {
    try {
      console.log(`📥 Downloading via Server Action: ${image.key}`)
      
      // Call Server Action
      const result = await downloadImageAction({
        imageKey: image.key,
        slug,
        userId,
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Download failed')
      }

      // Convert base64 to Blob
      const binaryString = atob(result.data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const blob = new Blob([bytes], { type: result.contentType || 'image/jpeg' })
      console.log(`✅ Server Action download successful: ${image.key}`)
      
      return blob
    } catch (error) {
      console.error(`❌ Server Action download failed for: ${image.key}`, error)
      
      // Fallback: Try direct S3 with fresh presigned URL
      try {
        console.log(`⚠️ Trying fallback with fresh presigned URL: ${image.key}`)
        
        const urlResult = await getImageDownloadUrlAction({
          imageKey: image.key,
          slug,
          userId,
        })

        if (!urlResult.success || !urlResult.url) {
          throw new Error(urlResult.error || 'Failed to get download URL')
        }

        const response = await fetch(urlResult.url, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const blob = await response.blob()
        console.log(`✅ Fallback download successful: ${image.key}`)
        return blob
        
      } catch (fallbackError) {
        console.error(`❌ All download methods failed for: ${image.key}`)
        console.error(fallbackError);
        throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  // Alternative: Download individual images without ZIP (no CORS needed)
  const downloadSingleImageDirect = (presignedUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = presignedUrl
    link.download = filename
    link.target = '_blank'
    // Add download attribute to force download
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev)
    setSelectedImages(new Set())
  }, [])

  const toggleImageSelection = useCallback((imageKey: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageKey)) {
        newSet.delete(imageKey)
      } else {
        newSet.add(imageKey)
      }
      return newSet
    })
  }, [])

  const selectAllImages = useCallback(() => {
    const allKeys = new Set<string>(displayImages.map((img: ImageItem) => img.key))
    setSelectedImages(allKeys)
  }, [displayImages])

  const deselectAllImages = useCallback(() => {
    setSelectedImages(new Set())
  }, [])

  const exportSelectedAsZip = useCallback(async () => {
    if (selectedImages.size === 0) {
      toast.error('Please select at least one image to export')
      return
    }

    setIsExporting(true)
    const zip = new JSZip()
    const imagesToExport = displayImages.filter((img: ImageItem) => 
      selectedImages.has(img.key)
    )

    try {
      // Download all selected images
      const downloadPromises = imagesToExport.map(async (image: ImageItem, index: number) => {
        try {
          // Use Server Action download (no CORS issues!)
          const blob = await downloadImageViaServerAction(image)
          
          // Extract filename from key or use generic name
          const keyParts = image.key.split('/')
          const originalFilename = keyParts[keyParts.length - 1]
          const extension = originalFilename.split('.').pop() || 'jpg'
          const filename = originalFilename || `image_${index + 1}.${extension}`
          
          zip.file(filename, blob)
        } catch (error) {
          console.error(`✗ Failed to download ${image.key}:`, error)
          captureException(error)
          throw error
        }
      })

      await Promise.all(downloadPromises)

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Create download link
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${slug}_images_${new Date().getTime()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Successfully exported ${selectedImages.size} image(s)`)
      setSelectionMode(false)
      setSelectedImages(new Set())
    } catch (error) {
      console.error('Error exporting images:', error)
      captureException(error)
      toast.error('Failed to export images. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [selectedImages, displayImages, slug])

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

        {/* Selection Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-gradient-to-r from-gold-50 to-white rounded-xl border border-gold-200">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectionMode}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectionMode 
                  ? 'bg-gold-400 text-white shadow-md hover:bg-gold-500' 
                  : 'bg-white text-gray-700 border border-gold-200 hover:border-gold-300 hover:shadow-sm'
              }`}
            >
              {selectionMode ? 'Cancel Selection' : 'Select Images'}
            </button>
            
            {selectionMode && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm text-gray-600 px-3 py-1 bg-white rounded-full border border-gold-200"
              >
                {selectedImages.size} selected
              </motion.span>
            )}
          </div>

          {selectionMode && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={selectAllImages}
                className="px-3 py-1.5 text-sm rounded-lg bg-white text-gray-700 border border-gold-200 hover:border-gold-300 hover:shadow-sm transition-all"
              >
                Select All
              </button>
              <button
                onClick={deselectAllImages}
                className="px-3 py-1.5 text-sm rounded-lg bg-white text-gray-700 border border-gold-200 hover:border-gold-300 hover:shadow-sm transition-all"
              >
                Deselect All
              </button>
              <button
                onClick={exportSelectedAsZip}
                disabled={selectedImages.size === 0 || isExporting}
                className="px-4 py-1.5 text-sm rounded-lg bg-gold-500 text-white hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Export as ZIP
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  const selected = displayImages.filter((img: ImageItem) => selectedImages.has(img.key))
                  selected.forEach((img: ImageItem, index: number) => {
                    const keyParts = img.key.split('/')
                    const filename = keyParts[keyParts.length - 1] || `image_${index + 1}.jpg`
                    setTimeout(() => downloadSingleImageDirect(img.presignedUrl, filename), index * 200)
                  })
                  toast.success(`Downloading ${selectedImages.size} image(s)`)
                }}
                disabled={selectedImages.size === 0}
                className="px-3 py-1.5 text-sm rounded-lg bg-gold-400 text-white hover:bg-gold-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                title="Download individually (no CORS needed)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Download All
              </button>
            </motion.div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayImages.map((image: ImageItem) => {
            const isSelected = selectedImages.has(image.key)
            return (
              <motion.div 
                key={image.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative aspect-square group overflow-hidden rounded-xl shadow-sm border transition-all duration-300 ${
                  isSelected 
                    ? 'border-gold-400 border-2 shadow-lg ring-2 ring-gold-300' 
                    : 'border-gold-100 hover:shadow-md'
                }`}
              >
                <div className="absolute inset-0 border border-gold-200 rounded-xl m-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
                
                {/* Selection Checkbox */}
                {selectionMode && (
                  <div className="absolute top-2 left-2 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleImageSelection(image.key)
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-gold-500 border-2 border-white shadow-lg'
                          : 'bg-white/90 border-2 border-gray-300 hover:border-gold-400'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                )}

                <div 
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => {
                    if (selectionMode) {
                      toggleImageSelection(image.key)
                    } else {
                      openImagePreview(image)
                    }
                  }}
                >
                  <Image
                    src={image.presignedUrl}
                    unoptimized={true}
                    alt={'Uploaded image'}
                    fill
                    className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-500 rounded-xl ${
                    selectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                  }`}></div>
                  
                  {!selectionMode && (
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
                  )}
                </div>
              </motion.div>
            )
          })}
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

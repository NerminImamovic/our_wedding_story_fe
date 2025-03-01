/* eslint-disable react-hooks/exhaustive-deps */
 
'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { uploadImages } from '../actions/uploadImages'
import React from 'react'
import { useParams } from 'next/navigation'
import { getWeddingDetails } from '@/api/apiClient'
import { useQuery } from '@tanstack/react-query'
import heic2any from 'heic2any'
import { toast, Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState<boolean[]>([])
  const [uploadProgress, setUploadProgress] = useState<number[]>([])
  const [converting, setConverting] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const { slug } = useParams() as { slug: string }

  useEffect(() => {
    setIsClient(true)
  }, [])

  const { data, error, isLoading } = useQuery({
    queryKey: isClient ? ['weddingDetails', slug] : [],
    queryFn: () => getWeddingDetails({ slug: slug as string })
  })

  const convertHeicToJpg = async (file: File): Promise<string> => {
    setConverting(true)
    try {
      const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg' })
      return URL.createObjectURL(convertedBlob as Blob)
    } catch (error) {
      console.error('HEIC conversion error:', error)
      toast.error('Failed to convert HEIC image')
      return URL.createObjectURL(file) // Fallback to original file
    } finally {
      setConverting(false)
    }
  }

  const processFiles = async (files: File[]) => {
    setSelectedFiles(files)
    setUploadProgress(new Array(files.length).fill(0))

    if (typeof window !== 'undefined') {
      try {
        const newPreviews = await Promise.all(files.map(async file => {
          if (file.name.toLowerCase().endsWith('.heic')) {
            return await convertHeicToJpg(file)
          }
          return URL.createObjectURL(file)
        }))
        
        setPreviews(prev => {
          prev.forEach(url => URL.revokeObjectURL(url))
          return newPreviews
        })
      } catch (error) {
        console.error('Preview generation error:', error)
        toast.error('Failed to generate previews for some files')
      }
    }

    setUploading(new Array(files.length).fill(false))
  }

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    await processFiles(files)
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      await processFiles(files)
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index])
      return newPreviews.filter((_, i) => i !== index)
    })
    setUploading(prev => prev.filter((_, i) => i !== index))
    setUploadProgress(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (selectedFiles.length === 0) return
    
    const uploadPromises = selectedFiles.map(async (file, i) => {
      setUploading(prev => {
        const newUploading = [...prev]
        newUploading[i] = true
        return newUploading
      })

      const formData = new FormData()
      formData.append('files', file)

      try {
        const result = await uploadImages({ slug, formData })
        
        if (result.success) {
          setUploadProgress(prev => {
            const newProgress = [...prev]
            newProgress[i] = 100
            return newProgress
          })
          return true
        } else {
          toast.error(`Failed to upload ${file.name}`)
          return false
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast.error(`Error uploading ${file.name}`)
        return false
      } finally {
        setUploading(prev => {
          const newUploading = [...prev]
          newUploading[i] = false
          return newUploading
        })
      }
    })

    const results = await Promise.all(uploadPromises)
    const successCount = results.filter(Boolean).length
    
    if (successCount === selectedFiles.length) {
      toast.success('All files uploaded successfully!')
    } else if (successCount > 0) {
      toast.success(`${successCount} of ${selectedFiles.length} files uploaded successfully`)
    }

    // Reset after a short delay to show completion state
    setTimeout(() => {
      setSelectedFiles([])
      setPreviews([])
      setUploadProgress([])
      
      // Reset the file input element
      if (isClient) {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
      }
    }, 2000)
  }, [selectedFiles, isClient, slug])

  const isUploading = uploading.some(status => status)

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <Toaster position="top-center" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-4 border-t-4 border-t-transparent border-purple-600 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            <p>Failed to load wedding details. Please try again later.</p>
          </div>
        ) : data && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="flex flex-col items-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
                Dobro došli na vjenčanje od {data?.bride} i {data?.groom}
              </h1>
              {data.coverImageUrl && (
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Image 
                    src={data.coverImageUrl} 
                    alt="Cover Image" 
                    height={400} 
                    width={400} 
                    className="mt-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300" 
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="w-full h-full flex flex-col">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`relative block w-full flex-grow text-sm text-slate-500
                border-2 border-dashed ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-violet-700'} 
                p-6 rounded-lg transition-colors duration-200 cursor-pointer`}
            >
              <div className="flex flex-col items-center justify-center space-y-2 h-full">
                <svg className="w-12 h-12 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="text-center font-medium">Drag and drop images or videos here, or click to select files</p>
                <p className="text-xs text-gray-500">Supports: JPG, PNG, GIF, MP4, HEIC</p>
              </div>
              <input
                type="file"
                accept="image/*,video/*,.heic"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            
            {selectedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={isUploading || converting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg 
                      hover:from-purple-700 hover:to-pink-700 disabled:opacity-70 disabled:cursor-not-allowed
                      transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-t-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      </>
                    ) : converting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-t-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      </>
                    ) : (
                      'Upload Files'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="w-full h-full flex flex-col">
            <div className="relative flex-grow">
              <AnimatePresence>
                {previews.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-2 gap-3 h-full"
                  >
                    {previews.map((preview, index) => (
                      <motion.div 
                        key={index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative aspect-square group overflow-hidden rounded-lg shadow-md"
                      >
                        {preview.match(/.(mp4|webm|ogg)$/i) ? (
                          <video
                            src={preview}
                            controls
                            className="object-cover w-full h-full rounded-lg"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <Image
                              src={preview}
                              alt={`Selected file ${index + 1}`}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        )}
                        
                        {uploading[index] && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 rounded-lg">
                            <div className="w-5 h-5 border-2 border-t-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                          </div>
                        )}
                        
                        {uploadProgress[index] === 100 && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-60 rounded-lg"
                          >
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </motion.div>
                        )}
                        
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                          aria-label="Remove file"
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {selectedFiles[index]?.name || `File ${index + 1}`}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {converting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg z-10">
                  <div className="w-12 h-12 border-4 border-t-4 border-t-transparent border-white rounded-full animate-spin mb-3"></div>
                  <p className="text-white font-medium">Converting HEIC images...</p>
                  <p className="text-white text-sm opacity-80">This may take a moment</p>
                </div>
              )}
              
              {!previews.length && !converting && (
                <div className="h-full min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-400 text-center">
                    Selected images will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

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
import { captureException } from '@sentry/nextjs';

export default function UploadComponent() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState<boolean[]>([])
  const [uploadProgress, setUploadProgress] = useState<number[]>([])
  const [converting, setConverting] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

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
    setUploadComplete(false)

    if (typeof window !== 'undefined') {
      try {
        toast.loading('Preparing your files...', { id: 'preparing' })
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
        toast.dismiss('preparing')
        toast.success(`${files.length} files ready to upload`)
      } catch (error) {
        console.error('Preview generation error:', error)
        toast.error('Failed to generate previews for some files')
        toast.dismiss('preparing')
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
    
    const uploadToastId = toast.loading('Starting upload...')
    
    const uploadPromises = selectedFiles.map(async (file, i) => {
      setUploading(prev => {
        const newUploading = [...prev]
        newUploading[i] = true
        return newUploading
      })

      const formData = new FormData()
      formData.append('files', file)

      try {
        toast.loading(`Uploading ${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}`, 
          { id: `file-${i}` })
        
        const result = await uploadImages({ slug, formData })
        
        if (result.success) {
          setUploadProgress(prev => {
            const newProgress = [...prev]
            newProgress[i] = 100
            return newProgress
          })
          toast.success(`Uploaded ${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}`, 
            { id: `file-${i}` })
          return true
        } else {
          toast.error(`Failed to upload ${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}`, 
            { id: `file-${i}` })
          return false
        }
      } catch (error) {
        console.error('Upload error:', error)

        captureException(error);

        toast.error((error as Error).message)

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
      toast.success('All files uploaded successfully!', { id: uploadToastId })
      setUploadComplete(true)
    } else if (successCount > 0) {
      toast.success(`${successCount} of ${selectedFiles.length} files uploaded successfully`, { id: uploadToastId })
      setUploadComplete(true)
    } else {
      toast.error('Upload failed. Please try again.', { id: uploadToastId })
    }

    // Reset after a short delay to show completion state
    setTimeout(() => {
      setSelectedFiles([])
      setPreviews([])
      setUploadProgress([])
      setUploadComplete(false)
      
      // Reset the file input element
      if (isClient) {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
      }
    }, 3000)
  }, [selectedFiles, isClient, slug])

  const isUploading = uploading.some(status => status)

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-4 border-t-transparent border-purple-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4 md:p-8">
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-4 md:p-8 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-60">
            <div className="w-12 h-12 border-4 border-t-4 border-t-transparent border-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="text-purple-600 font-medium animate-pulse">Loading wedding details...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-50 rounded-xl">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h3>
            <p className="text-red-600">Failed to load wedding details. Please try again later.</p>
          </div>
        ) : data && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-10"
          >
            <div className="flex flex-col items-center">
              <motion.h1 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text mb-6"
              >
                Dobro došli na vjenčanje od {data?.bride} i {data?.groom}
              </motion.h1>
              {data.coverImageUrl && (
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="relative overflow-hidden rounded-2xl shadow-2xl"
                >
                  <Image 
                    src={data.coverImageUrl} 
                    alt={`${data.bride} and ${data.groom}'s wedding`}
                    height={500} 
                    width={500} 
                    className="rounded-2xl hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div className="w-full h-full flex flex-col">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`relative block w-full flex-grow text-sm
                border-3 border-dashed rounded-2xl transition-all duration-300 cursor-pointer
                ${dragActive 
                  ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-200' 
                  : 'border-violet-300 hover:border-violet-500 hover:bg-violet-50'
                }
                p-8`}
            >
              <div className="flex flex-col items-center justify-center space-y-4 h-full">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <svg className="w-16 h-16 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </motion.div>
                <p className="text-center font-medium text-lg text-violet-800">Drag and drop images or videos here</p>
                <p className="text-center text-violet-600">or</p>
                <button className="px-6 py-2 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors shadow-md hover:shadow-lg">
                  Browse Files
                </button>
                <p className="text-xs text-gray-500 mt-4">Supports: JPG, PNG, GIF, MP4, HEIC</p>
              </div>
              <input
                type="file"
                accept="image/*,video/*,.heic"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload files"
              />
            </motion.div>
            
            {selectedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <div className="p-4 bg-gradient-to-r from-violet-50 to-pink-50 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-violet-800">
                      {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
                    </p>
                    {selectedFiles.length > 0 && !isUploading && !uploadComplete && (
                      <button 
                        onClick={() => {
                          setSelectedFiles([])
                          setPreviews([])
                          setUploading([])
                          setUploadProgress([])
                          
                          // Reset the file input element
                          if (isClient) {
                            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                            if (fileInput) {
                              fileInput.value = ''
                            }
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isUploading || converting || uploadComplete}
                    className={`w-full py-3 px-4 rounded-xl 
                      transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center
                      ${uploadComplete 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-700 hover:to-pink-700'
                      }
                      disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3 shadow-lg"></div>
                        <span className="animate-pulse">Uploading...</span>
                      </>
                    ) : converting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-t-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      </>
                    ) : uploadComplete ? (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>Upload Complete!</span>
                      </>
                    ) : (
                      'Upload Files'
                    )}
                  </motion.button>
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
                    className="grid grid-cols-2 gap-4 h-full"
                  >
                    {previews.map((preview, index) => (
                      <motion.div 
                        key={index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative aspect-square group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {preview.match(/.(mp4|webm|ogg)$/i) ? (
                          <video
                            src={preview}
                            controls
                            className="object-cover w-full h-full rounded-xl"
                          />
                        ) : (
                          <div className="relative w-full h-full overflow-hidden rounded-xl">
                            <Image
                              src={preview}
                              alt={`Selected file ${index + 1}`}
                              fill
                              className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        )}
                        
                        {uploading[index] && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 rounded-xl">
                            <div className="w-12 h-12 border-4 border-green-400 border-t-4 border-t-transparent rounded-full animate-spin mb-2 shadow-[0_0_10px_rgba(74,222,128,0.6)]"></div>
                          </div>
                        )}
                        
                        {uploadProgress[index] === 100 && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-70 rounded-xl"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </motion.div>
                          </motion.div>
                        )}
                        
                        {!uploading[index] && uploadProgress[index] !== 100 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                            aria-label="Remove file"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </motion.button>
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white text-xs p-3 truncate transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          {selectedFiles[index]?.name || `File ${index + 1}`}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {converting && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 rounded-xl z-10 backdrop-blur-sm"
                >
                  <div className="w-16 h-16 border-4 border-t-4 border-t-transparent border-white rounded-full animate-spin mb-4"></div>
                  <p className="text-white font-medium text-lg">Converting HEIC images...</p>
                  <p className="text-white text-sm opacity-80 mt-2">This may take a moment</p>
                  <div className="mt-4 w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      animate={{ width: ["0%", "100%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </div>
                </motion.div>
              )}
              
              {!previews.length && !converting && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50"
                >
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-gray-400 text-center font-medium">
                    Označene slike/video će se pojaviti ovdje
                  </p>
                  <p className="text-gray-300 text-center text-sm mt-2">
                    Select files from the left panel
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 

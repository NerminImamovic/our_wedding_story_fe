'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { getPresignedUploadUrl } from '../actions/uploadImages'
import React from 'react'
import { useParams } from 'next/navigation'
import { getWeddingDetails  } from '@/api/apiClient'
import { useQuery } from '@tanstack/react-query'
import { toast, Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { captureException } from '@sentry/nextjs';
import { uploadFileToS3 } from '@/api/s3PresingedClient'
import ImageGalleryComponent from './ImageGalleryComponent'

export default function UploadComponent({ slug, userId }: { slug: string, userId: string }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState<boolean[]>([])
  const [uploadProgress, setUploadProgress] = useState<number[]>([])
  const [converting, setConverting] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

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

      if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const heic2any = require('heic2any');

        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg' })

        return URL.createObjectURL(convertedBlob as Blob)
      }

      return '';
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        
        const presignedUrlResponse = await getPresignedUploadUrl({ fileName: file.name, prefix: slug, contentType: file.type, userId: userId })
        
        console.log(JSON.stringify(presignedUrlResponse, null, 2))


        if (!presignedUrlResponse.presignedUrl) {
          toast.error('Failed to get presigned URL')
          return false
        }

        // Upload file to S3 using the presigned URL
        const uploadResponse = await uploadFileToS3({ file, presignedUrl: presignedUrlResponse.presignedUrl });

        if (uploadResponse.ok) {
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[i] = 100;
            return newProgress;
          });
          toast.success(`Uploaded ${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}`, 
            { id: `file-${i}` });
          return true;
        } else {
          toast.error(`Failed to upload ${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}`, 
            { id: `file-${i}` });
          return false;
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
  }, [selectedFiles, isClient, slug, data?.token])

  const isUploading = uploading.some(status => status)

  if (!isClient) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-4 border-t-transparent border-gold-400 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-serif relative overflow-hidden">
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
        className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 overflow-hidden border border-gold-100 relative"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.03), rgba(255, 255, 255, 0) 70%)'
        }}
      >
        {/* Gold corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-gold-200"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-gold-200"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-gold-200"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-gold-200"></div>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-60">
            <div className="w-12 h-12 border-4 border-t-4 border-t-transparent border-gold-300 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium animate-pulse italic">Loading wedding details...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-rose-50 rounded-xl border border-rose-100">
            <svg className="w-16 h-16 text-rose-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-bold text-rose-700 mb-2">Something went wrong</h3>
            <p className="text-rose-600">Failed to load wedding details. Please try again later.</p>
          </div>
        ) : data && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="flex flex-col items-center">
              {/* Elegant wedding divider */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="mb-6 relative"
              >
                <div className="flex items-center justify-center gap-4 w-full">
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
              </motion.div>
              
              <motion.h1 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="text-3xl md:text-4xl font-light text-gray-800 mb-6 tracking-wider"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Dobro došli na vjenčanje od <span className="font-medium text-gold-600">{data?.bride}</span> i <span className="font-medium text-gold-600">{data?.groom}</span>
              </motion.h1>
              
              {data.coverImageUrl && (
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                  className="relative overflow-hidden rounded-xl shadow-md border border-gold-100 w-full max-w-lg mx-auto"
                >
                  <div className="absolute inset-0 border border-gold-200 rounded-xl m-2 pointer-events-none z-10"></div>
                  <Image 
                    src={data.coverImageUrl} 
                    alt={`${data.bride} and ${data.groom}'s wedding`}
                    height={500} 
                    width={800} 
                    className="rounded-xl hover:scale-105 transition-transform duration-1000" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        <div className="mt-10 mb-4 flex items-center justify-center gap-4 w-full">
          <div className="h-px bg-gradient-to-r from-white via-gold-200 to-white flex-grow max-w-xs"></div>
          <p className="text-gray-500 font-light italic text-sm">Share your memories</p>
          <div className="h-px bg-gradient-to-r from-white via-gold-200 to-white flex-grow max-w-xs"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-8">
          <div className="w-full h-full flex flex-col">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`relative block w-full flex-grow text-sm
                transition-all duration-300 cursor-pointer rounded-xl overflow-hidden
                ${dragActive 
                  ? 'shadow-lg' 
                  : 'shadow-sm'
                }`}
            >
              <div className={`absolute inset-0 border-2 border-dashed rounded-xl z-10 pointer-events-none transition-colors duration-300
                ${dragActive ? 'border-gold-400' : 'border-gold-200'}`}></div>
              
              <div className={`absolute inset-0 bg-gradient-to-b transition-opacity duration-300
                ${dragActive 
                  ? 'from-gold-50 to-white opacity-100' 
                  : 'from-gold-50/30 to-white opacity-50'
                }`}></div>
                
              <div className="flex flex-col items-center justify-center space-y-4 h-full relative z-20 py-12 px-8">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="text-gold-400"
                >
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </motion.div>
                <p className="text-center font-medium text-lg text-gray-700">Drag and drop images or videos here</p>
                <p className="text-center text-gray-500 italic">or</p>
                <button className="px-8 py-2.5 bg-white text-gold-700 rounded-full hover:bg-gold-50 transition-colors shadow-sm hover:shadow border border-gold-300 font-medium tracking-wide">
                  Browse Files
                </button>
                <p className="text-xs text-gray-400 mt-4">Supports: JPG, PNG, GIF, MP4, HEIC</p>
              </div>
              <input
                type="file"
                accept="image/*,video/*,.heic"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
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
                <div className="p-5 bg-white rounded-xl shadow-sm border border-gold-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">
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
                        className="text-xs text-rose-400 hover:text-rose-600 transition-colors font-medium"
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
                      transition-all duration-300 shadow-sm font-medium tracking-wide
                      ${uploadComplete 
                        ? 'bg-gradient-to-r from-gold-200 to-gold-100 text-gold-800 border border-gold-200' 
                        : 'bg-gradient-to-r from-gold-400 to-gold-300 border border-gold-300 hover:from-gold-500 hover:to-gold-400'
                      }
                      disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        <span className="animate-pulse">Uploading...</span>
                      </div>
                    ) : converting ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-t-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        <span>Converting...</span>
                      </div>
                    ) : uploadComplete ? (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>Upload Complete!</span>
                      </div>
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
                        className="relative aspect-square group overflow-hidden rounded-xl shadow-sm border border-gold-100 hover:shadow-md transition-all duration-300"
                      >
                        {/* Gold frame effect on images */}
                        <div className="absolute inset-0 border border-gold-200 rounded-xl m-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
                        
                        {preview.match(/\.(mp4|webm|ogg|mov|MOV)$/i) || selectedFiles[index]?.type.startsWith('video/') ? (
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
                              className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </div>
                        )}
                        {uploading[index] && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl z-20">
                            <div className="w-10 h-10 border-3 border-gold-300 border-t-3 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p className="text-sm text-gray-600 animate-pulse">Uploading...</p>
                          </div>
                        )}
                        
                        {uploadProgress[index] === 100 && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center bg-gold-400/30 backdrop-blur-sm rounded-xl z-20"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 20 }}
                              className="bg-white/90 p-4 rounded-full shadow-lg"
                            >
                              <svg className="w-8 h-8 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                            className="absolute top-2 right-2 bg-white text-rose-400 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-rose-600 shadow-sm border border-rose-100 z-20"
                            aria-label="Remove file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </motion.button>
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-xs p-3 truncate transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
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
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-xl z-10 backdrop-blur-sm border border-gold-100"
                >
                  <div className="w-16 h-16 border-3 border-t-3 border-t-transparent border-gold-300 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-700 font-medium text-lg">Converting HEIC images...</p>
                  <p className="text-gray-500 text-sm mt-2 italic">This may take a moment</p>
                  <div className="mt-4 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-gold-200 to-gold-400 rounded-full"
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
                  className="h-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-gold-200 rounded-xl bg-white"
                >
                  <svg className="w-16 h-16 text-gold-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-gray-600 text-center font-medium">
                    Označene slike/video će se pojaviti ovdje
                  </p>
                  <p className="text-gray-400 text-center text-sm mt-2 italic">
                    Select files from the left panel
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <ImageGalleryComponent slug={slug} userId={userId} />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 flex flex-col items-center"
        >
          <div className="flex items-center justify-center gap-4 w-full mb-3">
            <div className="h-px bg-gradient-to-r from-white via-gold-200 to-white flex-grow max-w-xs"></div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gold-300">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" opacity="0.5" />
            </svg>
            <div className="h-px bg-gradient-to-r from-white via-gold-200 to-white flex-grow max-w-xs"></div>
          </div>
          <p className="text-gray-500 text-sm italic">Share your cherished moments from this special day</p>
        </motion.div>
      </motion.div>
    </div>
  )
} 

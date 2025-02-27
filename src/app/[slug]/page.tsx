 
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { uploadImages } from '../actions/uploadImages'
import React from 'react'
import { useParams } from 'next/navigation';
import { getWeddingDetails } from '@/api/apiClient'
import { useQuery } from '@tanstack/react-query'
import heic2any from 'heic2any'

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState<boolean[]>([])
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [converting, setConverting] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)

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
    const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg' })
    setConverting(false)
    return URL.createObjectURL(convertedBlob as Blob)
  }

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const files = Array.from(e.target.files)
    setSelectedFiles(files)


    if (typeof window !== 'undefined') {
      const newPreviews = await Promise.all(files.map(async file => {
        if (file.type === 'image/heic') {
          return await convertHeicToJpg(file)
        }
        return URL.createObjectURL(file)
      }))
      setPreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url))
        return newPreviews
      })
    }

    setUploading(new Array(files.length).fill(false))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (selectedFiles.length === 0) return

    setUploadStatus('')

    for (let i = 0; i < selectedFiles.length; i++) {
      setUploading(prev => {
        const newUploading = [...prev]
        newUploading[i] = true
        return newUploading
      })

      const formData = new FormData()
      formData.append('files', selectedFiles[i])

      try {
        const result = await uploadImages({ slug, formData })

        if (result.success) {
          setUploadStatus(prev => prev + `File ${i + 1} uploaded successfully!\n`)
        } else {
          setUploadStatus(prev => prev + `File ${i + 1} failed to upload. Please try again.\n`)
        }
      } catch (error) {
        console.error('Upload error:', error)
        setUploadStatus(prev => prev + `File ${i + 1} upload failed. Please try again.\n`)
      } finally {
        setUploading(prev => {
          const newUploading = [...prev]
          newUploading[i] = false
          return newUploading
        })
      }
    }

    setSelectedFiles([])
    setPreviews([])
    setTimeout(() => setUploadStatus(''), 3000) // Clear status after 3 seconds

    // Reset the file input element to clear the selected files
    if (isClient) {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [selectedFiles, isClient])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            {data && (
                <div className="text-center mb-8">
                    <div className="flex flex-col items-center">
                      <h1 className="text-4xl font-bold text-gray-900 text-center">Dobro došli na vjenčanje od {data?.bride} i {data?.groom}</h1>
                      {data.coverImageUrl && (
                          <Image src={data.coverImageUrl} alt="Cover Image" height={400} width={400} className="mt-4 rounded-lg max-h-200px" />
                      )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="w-full">
                    <div
                        onDrop={async (e) => {
                            e.preventDefault();
                            const files = Array.from(e.dataTransfer.files);
                            setSelectedFiles(files);

                            const newPreviews = files.map(file => URL.createObjectURL(file));
                            setPreviews(prev => {
                                prev.forEach(url => URL.revokeObjectURL(url));
                                return newPreviews;
                            });

                            setUploading(new Array(files.length).fill(false))
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-violet-50 file:text-violet-700
                            hover:file:bg-violet-100 border-2 border-dashed border-violet-700 p-4 rounded-lg"
                    >
                        <p className="text-center">Drag and drop images or videos here, or click to select files</p>
                        <input
                            type="file"
                            accept="image/*,video/*,.heic"
                            multiple
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-violet-50 file:text-violet-700
                            hover:file:bg-violet-100"
                        />
                    </div>
                    
                    {selectedFiles.length > 0 && (
                        <>
                            <button
                                onClick={handleSubmit}
                                disabled={uploading.some(status => status)}
                                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-300"
                            >
                                {uploading.some(status => status) ? 'Uploading...' : 'Upload Files'}
                            </button>
                            <p className="mt-2 text-center text-sm text-slate-500 whitespace-pre-line">{uploadStatus}</p>
                        </>
                    )}
                </div>
                <div className="w-full max-w-2xl mx-auto relative">
                    <div className="grid grid-cols-2 gap-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative aspect-square group">
                                {preview.match(/.(mp4|webm|ogg)$/i) ? (
                                    <video
                                        src={preview}
                                        controls
                                        className="object-cover rounded-lg"
                                    />
                                ) : (
                                    <Image
                                        src={preview}
                                        alt={`Selected file ${index + 1}`}
                                        fill
                                        className="object-cover rounded-lg"
                                    />
                                )}
                                {uploading[index] ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                        <div className="w-8 h-8 border-4 border-t-4 border-t-transparent border-white rounded-full animate-spin"></div>
                                    </div>
                                ) : uploadStatus.includes(`File ${index + 1} upload failed`) ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-50 rounded-lg">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </div>
                                ) : uploadStatus.includes(`File ${index + 1} uploaded successfully`) ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-50 rounded-lg">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                ) : null}
                                <button
                                    onClick={() => {
                                        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
                                        setPreviews(prev => prev.filter((_, i) => i !== index))
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ borderRadius: '50%' }}
                                >
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    {converting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                            <div className="w-8 h-8 border-4 border-t-4 border-t-transparent border-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  )
}

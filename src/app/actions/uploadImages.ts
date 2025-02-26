'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { revalidatePath } from 'next/cache'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadCoverImage(formData: FormData) {
  const file = formData.get('coverImage') as File
  const key = `uploads/${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_VJENCANJE_COVER_IMAGES,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    const url = `https://${process.env.AWS_BUCKET_VJENCANJE_COVER_IMAGES}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    return { success: true, url }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Upload failed' }
  }
}

export async function uploadImages({ slug, formData }: { slug: string, formData: FormData }) {
  try {
    const files = formData.getAll('files') as File[]
    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const key = `${slug}/${Date.now()}-${file.name}`
      
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME_VJENCANJE,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }))

      return `https://${process.env.AWS_BUCKET_NAME_VJENCANJE}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    })

    const urls = await Promise.all(uploadPromises)
    revalidatePath('/')
    return { success: true, urls }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Upload failed' }
  }
} 

'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { revalidatePath } from 'next/cache'

const s3Client = new S3Client({
  region: process.env.WEDDING_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.WEDDING_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.WEDDING_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadCoverImage(formData: FormData) {
  const file = formData.get('coverImage') as File
  const key = `uploads/${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.WEDDING_AWS_BUCKET_VJENCANJE_COVER_IMAGES,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    const url = `https://${process.env.WEDDING_AWS_BUCKET_VJENCANJE_COVER_IMAGES}.s3.${process.env.WEDDING_AWS_REGION}.amazonaws.com/${key}`
    return { success: true, url }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function uploadImages({ slug, formData, userId }: { slug: string, formData: FormData, userId?: string }) {
  try {
    const files = formData.getAll('files') as File[]
    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const key = `${slug}/${userId}/${Date.now()}-${file.name}`

      console.log('Uploading image to S3:', key)
      console.log('Buffer:', buffer)
      console.log('File type:', file.type)
      
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.WEDDING_AWS_BUCKET_NAME_VJENCANJE,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }))

      return `https://${process.env.WEDDING_AWS_BUCKET_NAME_VJENCANJE}.s3.${process.env.WEDDING_AWS_REGION}.amazonaws.com/${key}`
    })

    const urls = await Promise.all(uploadPromises)
    revalidatePath('/')
    return { success: true, urls }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: (error as Error).message }
  }
} 

export async function getPresignedUploadUrl({ 
  fileName, 
  prefix, 
  contentType, 
  userId,
}: { 
  fileName: string, 
  prefix: string, 
  contentType: string,
  userId: string,
}) {
  try {
    const key = `${prefix}/${userId}/${Date.now()}-${fileName}`;

    // `1746492691952-c7ccbbcb92ec86b87806ec9a6d124d1d-OWS_USER_ID_36707557-6568-40c8-a208-42302ec28b8e/1746492676048-DSC_6346.jpg`
    
    const command = new PutObjectCommand({
      Bucket: process.env.WEDDING_AWS_BUCKET_NAME_VJENCANJE,
      Key: key,
      ContentType: contentType,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    return { 
      success: true, 
      presignedUrl,
      key,
      url: `https://${process.env.WEDDING_AWS_BUCKET_NAME_VJENCANJE}.s3.${process.env.WEDDING_AWS_REGION}.amazonaws.com/${key}`
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return { 
      success: false, 
      error: (error as Error).message 
    };
  }
}

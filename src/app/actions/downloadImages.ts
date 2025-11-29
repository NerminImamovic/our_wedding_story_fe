'use server'

/**
 * Server Actions for downloading images from S3
 * This runs on the server and avoids CORS issues
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.WEDDING_AWS_REGION!,
    credentials: {
      accessKeyId: process.env.WEDDING_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.WEDDING_AWS_SECRET_ACCESS_KEY!,
    },
  });


interface DownloadImageParams {
  imageKey: string
  slug: string
  userId: string
}

/**
 * Download a single image from S3
 * Returns the image as a base64 string (works for images up to ~1MB)
 */
export async function downloadImageAction(params: DownloadImageParams): Promise<{
  success: boolean
  data?: string // base64 image data
  contentType?: string
  error?: string
}> {
  try {
    const { imageKey, slug, userId } = params

    // 1. Validate user has access (implement your logic)
    const hasAccess = await validateUserAccess(userId, slug)
    if (!hasAccess) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    // 2. Get object from S3
    const command = new GetObjectCommand({
      Bucket: process.env.WEDDING_AWS_BUCKET_NAME_VJENCANJE,
      Key: imageKey,
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      return {
        success: false,
        error: 'Image not found',
      }
    }

    // 3. Convert stream to buffer
    const chunks: Uint8Array[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const chunk of response.Body as any) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // 4. Convert to base64
    const base64 = buffer.toString('base64')
    const contentType = response.ContentType || 'image/jpeg'

    return {
      success: true,
      data: base64,
      contentType,
    }
  } catch (error) {
    console.error('Error downloading image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get a fresh presigned URL for an image
 * Better for large images (>1MB) - client downloads directly
 */
export async function getImageDownloadUrlAction(params: DownloadImageParams): Promise<{
  success: boolean
  url?: string
  expiresIn?: number
  error?: string
}> {
  try {
    const { imageKey, slug, userId } = params

    // Validate access
    const hasAccess = await validateUserAccess(userId, slug)
    if (!hasAccess) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    // Generate fresh presigned URL (server-side, secure)
    const command = new GetObjectCommand({
    Bucket: process.env.WEDDING_AWS_BUCKET_NAME_VJENCANJE,
      Key: imageKey,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    })

    return {
      success: true,
      url: presignedUrl,
      expiresIn: 300,
    }
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Download multiple images for ZIP export
 * Returns array of base64 images
 */
export async function downloadMultipleImagesAction(params: {
  images: Array<{ key: string; filename: string }>
  slug: string
  userId: string
}): Promise<{
  success: boolean
  images?: Array<{ filename: string; data: string; contentType: string }>
  error?: string
}> {
  try {
    const { images, slug, userId } = params

    // Validate access
    const hasAccess = await validateUserAccess(userId, slug)
    if (!hasAccess) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    // Download all images in parallel
    const downloadPromises = images.map(async (image) => {
      const result = await downloadImageAction({
        imageKey: image.key,
        slug,
        userId,
      })

      console.log("Result:", result)

      if (!result.success || !result.data) {
        throw new Error(`Failed to download ${image.filename}`)
      }

      return {
        filename: image.filename,
        data: result.data,
        contentType: result.contentType || 'image/jpeg',
      }
    })

    const downloadedImages = await Promise.all(downloadPromises)

    return {
      success: true,
      images: downloadedImages,
    }
  } catch (error) {
    console.error('Error downloading multiple images:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download images',
    }
  }
}

/**
 * Validate user has access to images in this slug
 * TODO: Implement your actual access control logic
 */
async function validateUserAccess(userId: string, slug: string): Promise<boolean> {
  // Example: Query your database to check if user has access to this wedding/slug
  // const wedding = await db.wedding.findFirst({
  //   where: { slug, OR: [{ ownerId: userId }, { guestIds: { has: userId } }] }
  // })
  // return !!wedding

  // For now, allow all (implement your logic!)
  console.log(`Validating access for user ${userId} to slug ${slug}`)
  return true
}

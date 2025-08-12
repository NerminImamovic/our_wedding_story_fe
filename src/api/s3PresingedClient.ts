export const uploadFileToS3 = async ({ file, presignedUrl }: { file: File, presignedUrl: string }): Promise<Response> => {
    return await fetch(presignedUrl, {
      method: 'PUT',
      body: file, // File is binary data that will be sent directly to S3
      headers: {
        'Content-Type': file.type,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
      },
      mode: 'cors',
      credentials: 'same-origin'
    });
  };

export const uploadFileToS3Chunked = async ({ 
  file, 
  presignedUrl, 
  chunkSize = 5 * 1024 * 1024, // 5MB chunks
  onProgress 
}: { 
  file: File, 
  presignedUrl: string, 
  chunkSize?: number,
  onProgress?: (progress: number) => void 
}): Promise<Response> => {
  // For files smaller than chunk size, upload directly
  if (file.size <= chunkSize) {
    return await uploadFileToS3({ file, presignedUrl });
  }

  // For larger files, use streaming approach
  return await uploadFileToS3Streaming({ file, presignedUrl, onProgress });
};

const uploadFileToS3Streaming = async ({ 
  file, 
  presignedUrl, 
  onProgress 
}: { 
  file: File, 
  presignedUrl: string, 
  onProgress?: (progress: number) => void 
}): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Response(xhr.responseText, { status: xhr.status }));
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};

export const uploadFileToS3WithRetry = async ({ 
  file, 
  presignedUrl, 
  maxRetries = 3,
  onProgress 
}: { 
  file: File, 
  presignedUrl: string, 
  maxRetries?: number,
  onProgress?: (progress: number) => void 
}): Promise<Response> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (file.size > 5 * 1024 * 1024) { // 5MB threshold
        return await uploadFileToS3Chunked({ file, presignedUrl, onProgress });
      } else {
        return await uploadFileToS3({ file, presignedUrl });
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError || new Error('Upload failed after all retry attempts');
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// const BASE_URL = 'https://w4dw49ovhe.execute-api.us-east-1.amazonaws.com/dev';
export const BASE_URL = 'https://api.our-wedding-story.com'

export const executeApiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  try {
    const response = await fetch(`${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

  if (!response) {
    return
  }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
} 

export const getWeddingDetails = async (queryParams: Record<string, string> = {}): Promise<any> => {
  const url = BASE_URL + '/wedding-details';
  const queryString = new URLSearchParams(queryParams).toString();
  return executeApiCall(`${url}?${queryString}`);
}

export const createWeddingDetails = async (bodyParams: Record<string, any> = {}, bearerToken: string): Promise<any> => {
  const url = `${BASE_URL}/wedding-details`;
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(bodyParams),
  };
  return executeApiCall(url, options);
}

export const getMyWeddingDetails = async (queryParams: Record<string, string> = {}, bearerToken?: string): Promise<any> => {
  const url = BASE_URL + '/my-wedding-details';
  const queryString = new URLSearchParams(queryParams).toString();
  const options: RequestInit = bearerToken ? {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
    },
  } : {};
  return executeApiCall(`${url}?${queryString}`, options);
}

export const getUserImages = async ({ slug, userId }: { slug: string, userId: string }): Promise<any> => {
  const url = `${BASE_URL}/my-images`;
  const queryString = new URLSearchParams({ slug, userId }).toString();
  return executeApiCall(`${url}?${queryString}`);
}

export const deleteUserImage = async ({ imageKey, bearerToken }: { imageKey: string, bearerToken: string }): Promise<any> => {
  const url = `${BASE_URL}/delete-image`;
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({ key: imageKey }),
  };
  return executeApiCall(url, options);
}

export const uploadFile = async ({
  file,
  prefix,
  bearerToken,
}: {
  file: File,
  prefix: string,
  bearerToken: string
}): Promise<any> => {
  const url = `${BASE_URL}/upload`;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('prefix', prefix);
  
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
    },
    body: formData,
  };
  
  return executeApiCall(url, options);
}

export const getPresignedUploadUrl = async ({
  fileName,
  prefix,
  contentType,
  bearerToken,
}: {
  fileName: string,
  prefix: string,
  contentType: string,
  bearerToken: string
}): Promise<{
  presignedUrl: string,
  key: string,
  bucket: string,
  expiresIn: number
}> => {
  const url = `${BASE_URL}/upload-presigned-url`;
  
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({
      fileName,
      prefix,
      contentType
    }),
  };
  
  return executeApiCall(url, options);
}

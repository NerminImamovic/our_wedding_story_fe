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

export const getMyWeddingDetails = async (queryParams: Record<string, string> = {}): Promise<any> => {
  const url = BASE_URL + '/my-wedding-details';
  const queryString = new URLSearchParams(queryParams).toString();
  return executeApiCall(`${url}?${queryString}`);
}

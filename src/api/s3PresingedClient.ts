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

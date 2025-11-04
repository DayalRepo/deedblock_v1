// Note: Pinata SDK is now only used server-side in API route
// Client-side functions use the API route for uploads

// Upload a single file to IPFS via API route (server-side)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function uploadFileToIPFS(file: File, fileName: string): Promise<{ hash: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }

    const result = await response.json();
    return {
      hash: result.hash,
      url: result.url,
    };
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Upload multiple files to IPFS
export async function uploadFilesToIPFS(files: File[]): Promise<Array<{ name: string; hash: string; url: string; mimeType: string }>> {
  try {
    const uploadPromises = files.map(file => 
      uploadFileToIPFS(file, file.name).then(result => ({
        name: file.name,
        hash: result.hash,
        url: result.url,
        mimeType: file.type,
      }))
    );

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading files to IPFS:', error);
    throw error;
  }
}

// Upload JSON data to IPFS via API route
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function uploadJSONToIPFS(data: any, fileName: string = 'data.json'): Promise<{ hash: string; url: string }> {
  try {
    // Create a JSON file blob
    const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], fileName, { type: 'application/json' });

    return await uploadFileToIPFS(jsonFile, fileName);
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error(`Failed to upload JSON to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get file URL from IPFS hash
export function getIPFSUrl(hash: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://salmon-adjacent-marmot-760.mypinata.cloud';
  return `${gateway}/ipfs/${hash}`;
}

// Test Pinata connection via API route
export async function testPinataConnection(): Promise<boolean> {
  try {
    // Test with a small file
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    await uploadFileToIPFS(testFile, 'test.txt');
    return true;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
}


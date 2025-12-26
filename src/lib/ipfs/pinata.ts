// Note: Pinata SDK is now only used server-side in API route
// Client-side functions use the API route for uploads
import { logger } from '@/utils/logger';

// Upload a single file to IPFS via API route (server-side)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Upload a single file to IPFS via API route (server-side)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function uploadFileToIPFS(file: File, fileName: string): Promise<{ hash: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Use relative URL to avoid origin issues and let browser handle it
    const apiUrl = '/api/ipfs/upload';

    // Get auth session for security
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Create abort controller for timeout (fallback for browsers without AbortSignal.timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

    if (!response.ok) {
      let errorMessage = 'Failed to upload file';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }

      // Provide more specific error messages
      if (response.status === 0 || response.status === 503) {
        errorMessage = 'Network error: Unable to reach the server. Please check your internet connection.';
      } else if (response.status === 413) {
        errorMessage = 'File too large. Please reduce the file size.';
      } else if (response.status >= 500) {
        // Prioritize server error message if available
        if (errorMessage === 'Failed to upload file') {
          errorMessage = 'Server error: Please try again later.';
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.hash) {
      throw new Error('Upload succeeded but no hash was returned from server');
    }

    return {
      hash: result.hash,
      url: result.url,
    };
    } catch (error) {
      logger.error('Error uploading file to IPFS:', error);
  
      // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('aborted')) {
        throw new Error('Upload timeout: The file upload took too long. Please check your internet connection and try again.');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }
      if (error.message.includes('CORS')) {
        throw new Error('Connection error: Please ensure you are using the correct domain and try again.');
      }
      throw error;
    }

    throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Upload multiple files to IPFS
export async function uploadFilesToIPFS(files: File[]): Promise<Array<{ name: string; hash: string; url: string; mimeType: string }>> {
  try {
    const results: Array<{ name: string; hash: string; url: string; mimeType: string }> = [];

    // Valid files check
    const validFiles = files.filter(f => f instanceof File);
    if (validFiles.length === 0) return [];

    logger.debug(`Starting sequential upload for ${validFiles.length} files...`);

    // Sequential upload loop to avoid network saturation on mobile
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        logger.debug(`Uploading file ${i + 1}/${validFiles.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        const result = await uploadFileToIPFS(file, file.name);

        results.push({
          name: file.name,
          hash: result.hash,
          url: result.url,
          mimeType: file.type || 'image/jpeg',
        });

        logger.debug(`✓ Successfully uploaded ${file.name}`);
      } catch (error) {
        logger.error(`❌ Failed to upload ${file.name}:`, error);
        throw new Error(`Failed to upload photo "${file.name}". Please try again.`);
      }
    }

    return results;
  } catch (error) {
    logger.error('Error uploading files to IPFS:', error);
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
    logger.error('Error uploading JSON to IPFS:', error);
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
    logger.error('Pinata connection test failed:', error);
    return false;
  }
}


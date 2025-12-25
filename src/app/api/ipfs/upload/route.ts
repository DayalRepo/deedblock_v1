import { NextRequest, NextResponse } from 'next/server';
import pinataSDK, { type PinataPinOptions } from '@pinata/sdk';
import { Readable } from 'stream';

// Initialize Pinata SDK on server side
const getPinata = () => {
  const apiKey = process.env.PINATA_API_KEY?.trim();
  const secretKey = process.env.PINATA_SECRET_KEY?.trim();
  const jwt = process.env.PINATA_JWT?.trim();

  // Try API key and secret first (object format per SDK documentation)
  if (apiKey && secretKey && apiKey !== '' && secretKey !== '') {
    try {
      return new pinataSDK({
        pinataApiKey: apiKey,
        pinataSecretApiKey: secretKey
      });
    } catch (error) {
      console.error('Error initializing Pinata SDK with API keys:', error);
      throw error;
    }
  }

  // Try JWT as alternative (correct parameter name per SDK README: pinataJWTKey)
  if (jwt && jwt !== '') {
    try {
      return new pinataSDK({
        pinataJWTKey: jwt
      });
    } catch (error) {
      console.error('Error initializing Pinata SDK with JWT:', error);
      throw error;
    }
  }

  throw new Error('Missing Pinata credentials. Please set PINATA_API_KEY and PINATA_SECRET_KEY (or PINATA_JWT) in your .env.local file and restart the server');
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const pinata = getPinata();

    // Convert File to buffer for Pinata
    let fileBuffer: ArrayBuffer;

    if (typeof file === 'string') {
      throw new Error('Expected file but received string');
    }

    if (typeof file.arrayBuffer === 'function') {
      fileBuffer = await file.arrayBuffer();
    } else {
      // Fallback for environments where File/Blob doesn't have arrayBuffer directly
      fileBuffer = await new Response(file).arrayBuffer();
    }

    const buffer = Buffer.from(fileBuffer);

    // Create a readable stream from buffer
    const stream = Readable.from(buffer);

    const options: PinataPinOptions = {
      pinataMetadata: {
        name: file.name,
      },
      pinataOptions: {
        cidVersion: 1 as const,
      },
    };

    const result = await pinata.pinFileToIPFS(stream, options);

    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://salmon-adjacent-marmot-760.mypinata.cloud';
    const url = `${gateway}/ipfs/${result.IpfsHash}`;

    return NextResponse.json({
      hash: result.IpfsHash,
      url: url,
    });
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}


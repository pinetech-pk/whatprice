import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

// Lazy initialization to avoid build-time errors
let imagekit: ImageKit | null = null;

function getImageKit() {
  if (!imagekit) {
    if (!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
        !process.env.IMAGEKIT_PRIVATE_KEY ||
        !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
      return null;
    }
    imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekit;
}

// GET: Generate authentication parameters for client-side upload
export async function GET() {
  try {
    const ik = getImageKit();

    if (!ik) {
      return NextResponse.json(
        { error: 'ImageKit not configured' },
        { status: 500 }
      );
    }

    // Generate authentication parameters
    const authParams = ik.getAuthenticationParameters();

    return NextResponse.json(authParams);
  } catch (error) {
    console.error('ImageKit auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication' },
      { status: 500 }
    );
  }
}

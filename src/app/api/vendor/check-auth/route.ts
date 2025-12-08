import { NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/auth/vendorAuth';

export async function GET() {
  try {
    const session = await getVendorSession();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: session.userId,
        vendorId: session.vendorId,
        email: session.email,
        storeName: session.storeName,
        verificationStatus: session.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Check auth error:', error);
    return NextResponse.json({
      authenticated: false,
    });
  }
}

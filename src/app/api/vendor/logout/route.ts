import { NextResponse } from 'next/server';
import { clearVendorSession } from '@/lib/auth/vendorAuth';

export async function POST() {
  try {
    await clearVendorSession();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Vendor logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

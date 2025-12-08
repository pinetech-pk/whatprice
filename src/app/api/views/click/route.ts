import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import { recordContactClick } from '@/lib/billing/cpvService';

// POST: Record a contact click
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.viewId) {
      return NextResponse.json(
        { error: 'View ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await recordContactClick(body.viewId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Record click error:', error);
    return NextResponse.json(
      { error: 'Failed to record click' },
      { status: 500 }
    );
  }
}

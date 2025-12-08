import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import { qualifyView } from '@/lib/billing/cpvService';

// POST: Qualify a view (mark as qualified after duration threshold)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.viewId) {
      return NextResponse.json(
        { error: 'View ID is required' },
        { status: 400 }
      );
    }

    if (typeof body.duration !== 'number') {
      return NextResponse.json(
        { error: 'Duration is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await qualifyView({
      viewId: body.viewId,
      duration: body.duration,
      scrollDepth: body.scrollDepth,
      clickedContact: body.clickedContact,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, needsCredits: (result as { needsCredits?: boolean }).needsCredits },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      charged: result.charged,
      reason: (result as { reason?: string }).reason,
    });
  } catch (error) {
    console.error('Qualify view error:', error);
    return NextResponse.json(
      { error: 'Failed to qualify view' },
      { status: 500 }
    );
  }
}

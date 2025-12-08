import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import { recordProductView } from '@/lib/billing/cpvService';
import { v4 as uuidv4 } from 'uuid';

// POST: Record a new product view
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get or create session ID
    const sessionId = body.sessionId || uuidv4();

    // Get client info
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const referer = request.headers.get('referer') || undefined;

    const result = await recordProductView({
      productId: body.productId,
      sessionId,
      userId: body.userId,
      viewType: body.viewType || 'direct',
      userAgent,
      ipAddress,
      referrer: referer,
      searchQuery: body.searchQuery,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      viewId: result.viewId,
      sessionId,
    });
  } catch (error) {
    console.error('Record view error:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}

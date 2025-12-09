import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Category from '@/models/Category';

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .select('name slug parent')
      .sort({ order: 1, name: 1 });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

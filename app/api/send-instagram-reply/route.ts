import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, commentId, replyTemplate } = body;

    if (!userId || !commentId || !replyTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: 'mock',
      message: 'Reply flow payload received correctly',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Server error',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
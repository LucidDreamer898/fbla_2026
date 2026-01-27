import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, data } = body;
    
    // Log to terminal (server console)
    console.log('═══════════════════════════════════════');
    console.log('DATABASE:', operation);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('═══════════════════════════════════════');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

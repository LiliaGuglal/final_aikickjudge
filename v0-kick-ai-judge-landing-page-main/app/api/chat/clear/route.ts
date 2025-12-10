import { NextRequest, NextResponse } from 'next/server';
import { clearSessionWithConfirmation, validateSessionId, handleApiError } from '@/lib/memory';

// Request body interface
interface ClearRequest {
  sessionId: string;
}

// Response interface
interface ClearResponse {
  success: boolean;
  message: string;
  sessionId: string;
  previousStats?: {
    messageCount: number;
    summariesCount: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body: ClearRequest = await req.json();
    const { sessionId } = body;

    // Validate request
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          message: 'Session ID is required and must be a string',
          sessionId: sessionId || '',
        } as ClearResponse,
        { status: 400 }
      );
    }

    // Validate session ID format
    const validation = validateSessionId(sessionId);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid session ID format: ${validation.errors.join(', ')}`,
          sessionId,
        } as ClearResponse,
        { status: 400 }
      );
    }

    // Clear the session
    const result = await clearSessionWithConfirmation(sessionId);

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          sessionId: result.sessionId,
          previousStats: result.previousStats,
        } as ClearResponse,
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          sessionId: result.sessionId,
          previousStats: result.previousStats,
        } as ClearResponse,
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Clear API Route Error:', error);
    
    // Log API error
    handleApiError(error instanceof Error ? error : new Error('Unknown error'), undefined, {
      endpoint: '/api/chat/clear',
      method: 'POST',
    });

    // Handle different error types
    if (error.message?.includes('JSON')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON in request body',
          sessionId: '',
        } as ClearResponse,
        { status: 400 }
      );
    }

    // Generic error handler
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while clearing the session',
        sessionId: '',
      } as ClearResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use POST to clear a session.',
      sessionId: '',
    } as ClearResponse,
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use POST to clear a session.',
      sessionId: '',
    } as ClearResponse,
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use POST to clear a session.',
      sessionId: '',
    } as ClearResponse,
    { status: 405 }
  );
}
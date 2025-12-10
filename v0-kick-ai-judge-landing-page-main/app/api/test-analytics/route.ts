import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEngine } from '@/lib/analytics';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { query } = await req.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('Testing analytics with query:', query);
    
    const analyticsEngine = new AnalyticsEngine(apiKey);
    
    // Test heuristic check
    const isLikely = analyticsEngine.isLikelyAnalyticsQuery(query);
    console.log('Heuristic check result:', isLikely);
    
    if (!isLikely) {
      return NextResponse.json({
        isLikely: false,
        message: 'Query does not appear to be analytics-related'
      });
    }
    
    // Process the query
    const result = await analyticsEngine.processQuery(query);
    
    return NextResponse.json({
      isLikely: true,
      result: result
    });
    
  } catch (error) {
    console.error('Test analytics error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Analytics test endpoint. Use POST with {"query": "your query"}'
  });
}
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { memoryManager, createMessage, generateUniqueSessionId, validateSessionId } from '@/lib/memory';
import { AnalyticsEngine } from '@/lib/analytics';
import { getChatVectorIntegration } from '@/lib/vector-search/chat-integration';

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY is not configured in environment variables');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Initialize Analytics Engine
const analyticsEngine = apiKey ? new AnalyticsEngine(apiKey) : null;

// Initialize Vector Search Integration
const vectorIntegration = getChatVectorIntegration();

// Initialize vector search on first load
if (process.env.VECTOR_SEARCH_ENABLED === 'true') {
  vectorIntegration.initialize().catch(error => {
    console.error('Vector search initialization failed:', error);
  });
}

// Request body interface
interface ChatRequest {
  message: string;
  sessionId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'model';
    parts: string;
  }>;
}

// System prompt with WAKO scoring rules
const SYSTEM_CONTEXT = `Ти — експертний АІ-суддя з кікбоксингу (проект KickAI). 
Твоя задача: відповідати на питання про правила, суддівство та оцінювання ударів згідно з правилами WAKO.
Відповідай українською мовою, професійно, коротко і по суті.

СИСТЕМА ОЦІНЮВАННЯ WAKO:

1. POINT FIGHTING (Поінт-файтінг):
- Удар рукою (голова/корпус): 1 бал
- Удар ногою в корпус: 1 бал
- Підсічка (Foot sweep): 1 бал
- Удар ногою в голову: 2 бали
- Удар ногою в корпус у стрибку: 2 бали
- Удар ногою в голову у стрибку: 3 бали
- Бій зупиняється після кожного влучання
- При розриві 10 балів - достроковий TKO

2. БЕЗПЕРЕРВНІ ДИСЦИПЛІНИ (Light, Kick Light, Full Contact, Low Kick, K-1):
- 1 ефективний удар = 1 бал на клікері
- Бій не зупиняється після удару
- Критерії зарахування: дозволена зона, чистота, сила, баланс
- Переможець раунду: 10:9 (або 10:8 при домінуванні/нокдауні)

3. ШТРАФНІ САНКЦІЇ:
- Виходи за межі (татамі): 1-й - попередження, 2-й/3-й - мінус 1 бал, 4-й - дискваліфікація
- Фоли (удари нижче пояса, відкритою рукавичкою, пасивність): попередження або мінус бал`;

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    if (!apiKey || !genAI) {
      console.error('API configuration error: Missing or invalid API key');
      console.error('API Key exists:', !!apiKey);
      console.error('GenAI initialized:', !!genAI);
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    console.log('API Key loaded successfully, length:', apiKey.length);

    // Parse request body
    const body: ChatRequest = await req.json();
    const { message, sessionId: providedSessionId } = body;

    // Check if this is an analytics query
    console.log('🔍 Checking if analytics query:', message);
    console.log('Analytics engine available:', !!analyticsEngine);
    
    if (analyticsEngine) {
      const isLikelyAnalytics = analyticsEngine.isLikelyAnalyticsQuery(message);
      console.log('Is likely analytics query:', isLikelyAnalytics);
      
      if (isLikelyAnalytics) {
        console.log('🔍 Detected potential analytics query, processing...');
        
        try {
          const analyticsResult = await analyticsEngine.processQuery(message);
          
          if (analyticsResult.isAnalytics && analyticsResult.content) {
            console.log('✅ Analytics processing successful');
            
            // Store user message in memory
            const userMessage = createMessage('user', message);
            const analyticsResponse = createMessage('assistant', analyticsResult.content);
            
            try {
              const sessionId = providedSessionId || generateUniqueSessionId();
              await memoryManager.addMessage(sessionId, userMessage);
              await memoryManager.addMessage(sessionId, analyticsResponse);
            } catch (memoryError) {
              console.error('Memory storage failed for analytics:', memoryError);
            }
            
            // Return analytics result directly (not streaming)
            return NextResponse.json({
              content: analyticsResult.content,
              isAnalytics: true,
              confidence: analyticsResult.confidence,
              executionTime: analyticsResult.executionTime,
              functionsUsed: analyticsResult.functionsUsed
            });
          }
        } catch (analyticsError) {
          console.error('Analytics processing failed:', analyticsError);
          // Fall through to regular chat processing
        }
      }
    } else {
      console.log('Analytics engine not available or not analytics query');
    }

    // Handle session ID
    let sessionId = providedSessionId;
    if (!sessionId) {
      sessionId = generateUniqueSessionId();
    } else {
      const validation = validateSessionId(sessionId);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Invalid session ID format' },
          { status: 400 }
        );
      }
    }

    // Validate message length (1-2000 characters)
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (message.length < 1 || message.length > 2000) {
      return NextResponse.json(
        { error: 'Message must be between 1-2000 characters' },
        { status: 400 }
      );
    }

    // Configure Gemini 2.5 Flash model with generation parameters
    const model = genAI.getGenerativeModel({
      model: 'models/gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Store user message in memory
    const userMessage = createMessage('user', message);
    try {
      await memoryManager.addMessage(sessionId, userMessage);
    } catch (memoryError) {
      console.error('Memory storage failed, continuing without memory:', memoryError);
      // Continue without memory - graceful degradation
    }

    // Get conversation context from memory
    let conversationContext = '';
    try {
      const context = await memoryManager.getContext(sessionId);
      if (context.summaries.length > 0 || context.recentMessages.length > 1) {
        conversationContext = memoryManager.formatContextForLLM(context);
      }
    } catch (memoryError) {
      console.error('Failed to get conversation context:', memoryError);
      // Continue without context - graceful degradation
    }

    // Enhance query with vector search if enabled
    let enhancedSystemPrompt = SYSTEM_CONTEXT;
    let vectorEnhancement = null;
    
    if (process.env.VECTOR_SEARCH_ENABLED === 'true') {
      try {
        vectorEnhancement = await vectorIntegration.enhanceQuery(message, sessionId);
        if (vectorEnhancement && vectorEnhancement.vectorResults.length > 0) {
          enhancedSystemPrompt = vectorIntegration.buildEnhancedPrompt(
            SYSTEM_CONTEXT,
            vectorEnhancement,
            message
          );
          console.log(`🔍 Vector search enhanced response with ${vectorEnhancement.vectorResults.length} relevant items`);
        }
      } catch (vectorError) {
        console.error('Vector search enhancement failed:', vectorError);
        // Continue without vector enhancement - graceful degradation
      }
    }

    // Create full prompt with system context and conversation history
    const fullPrompt = conversationContext 
      ? `${enhancedSystemPrompt}\n\n${conversationContext}\n\nПоточне питання користувача: ${message}`
      : `${enhancedSystemPrompt}\n\nПитання користувача: ${message}`;

    // Generate streaming response
    const result = await model.generateContentStream(fullPrompt);

    // Create a ReadableStream for streaming response
    const encoder = new TextEncoder();
    let assistantResponse = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            assistantResponse += text;
            controller.enqueue(encoder.encode(text));
          }
          
          // Store assistant response in memory after streaming is complete
          if (assistantResponse.trim()) {
            try {
              const assistantMessage = createMessage('assistant', assistantResponse.trim());
              await memoryManager.addMessage(sessionId, assistantMessage);
            } catch (memoryError) {
              console.error('Failed to store assistant response in memory:', memoryError);
              // Don't fail the request if memory storage fails
            }
          }
          
          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          console.error('Streaming error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            cause: error.cause
          });

          // Handle specific error types
          if (error.message?.includes('API key')) {
            controller.error(new Error('Invalid API key'));
          } else if (error.message?.includes('safety')) {
            controller.error(new Error('Content safety violation'));
          } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
            controller.error(new Error('Rate limit exceeded'));
          } else {
            controller.error(error);
          }
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Session-Id': sessionId, // Include session ID in response headers
      },
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      stack: error.stack
    });

    // Handle missing/invalid API key errors
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Handle content safety violations
    if (error.message?.includes('safety') || error.message?.includes('blocked')) {
      return NextResponse.json(
        { error: 'Message violates content policy' },
        { status: 400 }
      );
    }

    // Handle rate limiting
    if (error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'Too many requests, please wait' },
        { status: 429 }
      );
    }

    // Handle network errors
    if (error.message?.includes('network') || error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch')) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Generic error handler
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
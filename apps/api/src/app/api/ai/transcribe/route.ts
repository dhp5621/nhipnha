import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Dedicated Google GenAI model for Audio Transcription (`@google/genai` SDK)
const DEFAULT_GEMINI_AUDIO_MODEL = 'gemini-2.5-flash';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-family-id, x-member-id',
};

/**
 * Structured output schema using `@google/genai` `Type` enum for bilingual
 * Vietnamese ('vi') and English ('en') speech detection & verbatim transcription.
 */
const BILINGUAL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    detectedLanguages: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "ISO language codes detected in audio (e.g. ['vi', 'en'])",
    },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          language: {
            type: Type.STRING,
            description: "'vi' for Vietnamese, 'en' for English",
          },
          timestamp: {
            type: Type.STRING,
            description: 'e.g. 00:00 - 00:15',
          },
          transcript: {
            type: Type.STRING,
            description: 'Verbatim spoken words',
          },
        },
        required: ['language', 'transcript'],
      },
    },
  },
  required: ['detectedLanguages', 'segments'],
};

const BILINGUAL_PROMPT = `
Analyze this audio containing English and Vietnamese speech.
- Identify when speakers switch languages.
- Transcribe verbatim; do not translate Vietnamese into English or vice-versa.
- Keep loan words and technical terms intact.
- Categorize each segment by language ('vi' or 'en').
- If the audio is completely silent or has no human speech, return empty segments [].
`;

function extractSegmentsAndText(rawText?: string): {
  transcript: string;
  detectedLanguages: string[];
  segments: Array<{ language: string; timestamp?: string; transcript: string }>;
} | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const segments = Array.isArray(parsed.segments) ? parsed.segments : [];
      const joined = segments
        .map((s: any) => (typeof s?.transcript === 'string' ? s.transcript.trim() : ''))
        .filter(Boolean)
        .join(' ')
        .trim();

      if (joined) {
        return {
          transcript: joined,
          detectedLanguages: Array.isArray(parsed.detectedLanguages)
            ? parsed.detectedLanguages
            : [],
          segments,
        };
      }
      if (Array.isArray(parsed.segments) && parsed.segments.length === 0) {
        return {
          transcript: '',
          detectedLanguages: [],
          segments: [],
        };
      }
    } catch {
      // Fall through to plain text check
    }
  }

  if (trimmed.length > 0) {
    return {
      transcript: trimmed.replace(/^["“]|["”]$/g, '').trim(),
      detectedLanguages: [],
      segments: [],
    };
  }
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      endpoint: '/api/ai/transcribe',
      sdk: '@google/genai',
      defaultModel: DEFAULT_GEMINI_AUDIO_MODEL,
      description:
        'Dedicated Google GenAI (@google/genai) Bilingual (vi/en) Audio Transcription Endpoint',
      methods: ['GET', 'POST', 'OPTIONS'],
      hasGeminiAudioKey: Boolean(
        process.env.GEMINI_AUDIO_API_KEY || process.env.GEMINI_API_KEY
      ),
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      audioUrl,
      language = 'vi',
      localTranscript = '',
      isDemo = false,
      speakerRole = 'CHILD',
    } = body;

    if (!audioUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing audioUrl for transcription',
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const demoFallbackText =
      speakerRole === 'PARENT'
        ? language === 'en'
          ? 'My sweet child, how was your day at home with grandma? Parents just finished our factory shift, we miss you so much. Sleep tight and sweet dreams!'
          : 'An yêu của mẹ ơi, hôm nay con ở quê có ngoan không? Bố mẹ vừa tan ca làm xong, nhớ con nhiều lắm. Con chúc bà ngủ sớm rồi đi ngủ ngoan nhé!'
        : language === 'en'
        ? 'I had so much fun at school today. I drew a lotus flower for Mom and had delicious dinner with grandma.'
        : 'Chiều nay con đi học về vui lắm, con vẽ bông hoa sen tặng mẹ và ăn canh chua bà nấu.';

    const finalFallback =
      (typeof localTranscript === 'string' && localTranscript.trim()) ||
      (isDemo ? demoFallbackText : '');

    let mimeType = 'audio/webm';
    let base64Data = '';

    if (audioUrl.startsWith('data:')) {
      const commaIdx = audioUrl.indexOf(',');
      if (commaIdx !== -1) {
        const header = audioUrl.slice(0, commaIdx);
        base64Data = audioUrl.slice(commaIdx + 1).trim();
        const mimeMatch = header.match(/^data:([^;]+)/);
        if (mimeMatch && mimeMatch[1]) {
          // Strip codec parameters (e.g. 'audio/webm;codecs=opus' -> 'audio/webm')
          mimeType = mimeMatch[1].trim();
        }
      }
    }

    // Dedicated Google GenAI key for Audio processing ONLY (Text/Empathy uses CYO on /api/ai/empathy-assistant)
    const apiKey =
      process.env.GEMINI_AUDIO_API_KEY || process.env.GEMINI_API_KEY;
    const configuredModel =
      process.env.GEMINI_AUDIO_MODEL ||
      process.env.GEMINI_MODEL ||
      DEFAULT_GEMINI_AUDIO_MODEL;
    const modelName = configuredModel.includes('1.5')
      ? 'gemini-2.5-flash'
      : configuredModel;

    if (apiKey && base64Data) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: BILINGUAL_PROMPT,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: BILINGUAL_RESPONSE_SCHEMA,
            temperature: 0.1,
          },
        });

        const parsed = extractSegmentsAndText(response.text);
        if (parsed && parsed.transcript) {
          return NextResponse.json(
            {
              success: true,
              transcript: parsed.transcript,
              transcription: parsed.transcript,
              detectedLanguages: parsed.detectedLanguages,
              segments: parsed.segments,
              source: 'google-genai-sdk',
              model: modelName,
            },
            { headers: CORS_HEADERS }
          );
        }
      } catch (err) {
        console.warn('@google/genai audio transcription error:', err);
      }
    }

    // Fallback to local browser speech recognition if Google GenAI cannot transcribe
    return NextResponse.json(
      {
        success: true,
        transcript: finalFallback,
        transcription: finalFallback,
        source: localTranscript?.trim()
          ? 'local-speech-fallback'
          : !apiKey
          ? 'waiting-gemini-api-key'
          : isDemo
          ? 'demo-fallback'
          : 'no-speech-detected',
      },
      { headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      {
        success: true,
        transcript: '',
        transcription: '',
        source: 'fallback-exception',
      },
      { headers: CORS_HEADERS }
    );
  }
}

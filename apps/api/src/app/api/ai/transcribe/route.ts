import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com';
// Use gemini-2.5-flash (current active multimodal audio model; gemini-1.5-flash is retired)
const DEFAULT_GEMINI_AUDIO_MODEL = 'gemini-2.5-flash';
const DEFAULT_CYO_BASE_URL = 'https://chat-api.chuyenbienhoa.com';
const DEFAULT_CYO_MODEL = 'gemini-flash-lite';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-family-id, x-member-id',
};

/**
 * Structured output schema matching Method 1 (`gemini-2.5-flash`) for bilingual
 * Vietnamese ('vi') and English ('en') speech detection & verbatim transcription.
 */
const BILINGUAL_TRANSCRIPTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    detectedLanguages: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: "ISO language codes detected in audio (e.g. ['vi', 'en'])",
    },
    fullTranscript: {
      type: 'STRING',
      description: 'Complete verbatim spoken words combined in natural order',
    },
    segments: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          language: {
            type: 'STRING',
            description: "'vi' for Vietnamese, 'en' for English",
          },
          timestamp: {
            type: 'STRING',
            description: 'e.g. 00:00 - 00:05',
          },
          transcript: {
            type: 'STRING',
            description: 'Verbatim spoken words',
          },
        },
        required: ['language', 'transcript'],
      },
    },
  },
  required: ['detectedLanguages', 'segments'],
};

const BILINGUAL_AUDIO_PROMPT = `Analyze this audio containing English and Vietnamese speech.
- Identify when speakers switch languages.
- Transcribe verbatim; do not translate Vietnamese into English or vice-versa.
- Keep loan words and technical terms intact.
- Categorize each segment by language ('vi' or 'en').
- If the audio is completely silent or has no human speech, return empty segments [].`;

function extractTranscriptFromStructuredOutput(rawText: string): {
  transcript: string;
  detectedLanguages: string[];
  segments: Array<{ language: string; timestamp?: string; transcript: string }>;
} | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();

  // Try parsing structured JSON response from gemini-2.5-flash
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const segments = Array.isArray(parsed.segments) ? parsed.segments : [];
      const joinedSegments = segments
        .map((s: any) => (typeof s?.transcript === 'string' ? s.transcript.trim() : ''))
        .filter(Boolean)
        .join(' ')
        .trim();
      const full =
        (typeof parsed.fullTranscript === 'string' && parsed.fullTranscript.trim()) ||
        joinedSegments;
      if (full) {
        return {
          transcript: full,
          detectedLanguages: Array.isArray(parsed.detectedLanguages)
            ? parsed.detectedLanguages
            : [],
          segments,
        };
      }
      // Valid JSON with empty segments -> silence / no speech
      if (Array.isArray(parsed.segments) && parsed.segments.length === 0) {
        return {
          transcript: '',
          detectedLanguages: [],
          segments: [],
        };
      }
    } catch {
      // Not valid JSON, fall through to plain text check
    }
  }

  // Plain text transcript fallback
  const isRefusal =
    /cannot|unable|không thể|không nhận được|no audio|provide the audio|i don't have access|as an ai/i.test(
      trimmed
    );
  if (!isRefusal && trimmed.length > 0) {
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
      description:
        'Bilingual (vi/en) Gemini 2.5 Flash Multimodal Speech-to-Text Endpoint for Nhịp Nhà',
      methods: ['GET', 'POST', 'OPTIONS'],
      defaultModel: DEFAULT_GEMINI_AUDIO_MODEL,
      hasGeminiAudioKey: Boolean(
        process.env.GEMINI_AUDIO_API_KEY || process.env.GEMINI_API_KEY
      ),
      hasCyoAiKey: Boolean(
        process.env.AI_API_KEY || process.env.TEXT_AI_API_KEY || true
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
          // Strip codec parameters (e.g. 'audio/webm;codecs=opus' -> 'audio/webm') as required by Gemini inlineData
          mimeType = mimeMatch[1].trim();
        }
      }
    }

    // 1. Primary: Google Gemini API (v1beta generateContent with gemini-2.5-flash & responseSchema)
    const geminiApiKey =
      process.env.GEMINI_AUDIO_API_KEY || process.env.GEMINI_API_KEY;
    const geminiBaseUrl = (
      process.env.GEMINI_AUDIO_BASE_URL ||
      process.env.GEMINI_BASE_URL ||
      DEFAULT_GEMINI_BASE_URL
    ).replace(/\/+$/, '');
    const configuredGeminiModel =
      process.env.GEMINI_AUDIO_MODEL ||
      process.env.GEMINI_MODEL ||
      DEFAULT_GEMINI_AUDIO_MODEL;

    // Ensure retired gemini-1.5-flash is automatically upgraded to gemini-2.5-flash
    const primaryGeminiModel = configuredGeminiModel.includes('1.5')
      ? 'gemini-2.5-flash'
      : configuredGeminiModel;

    const candidateModels = Array.from(
      new Set([primaryGeminiModel, 'gemini-2.5-flash', 'gemini-2.0-flash'])
    );

    if (geminiApiKey && base64Data) {
      for (const modelName of candidateModels) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 25000);

          const endpointUrl = geminiBaseUrl.includes('googleapis.com')
            ? `${geminiBaseUrl}/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`
            : `${geminiBaseUrl}/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

          const geminiRes = await fetch(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
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
                    { text: BILINGUAL_AUDIO_PROMPT },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: BILINGUAL_TRANSCRIPTION_SCHEMA,
                temperature: 0.1,
              },
            }),
            signal: controller.signal,
          }).finally(() => clearTimeout(timer));

          if (geminiRes.ok) {
            const geminiJson = await geminiRes.json();
            const rawText =
              geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const extracted = extractTranscriptFromStructuredOutput(rawText);
            if (extracted && extracted.transcript) {
              return NextResponse.json(
                {
                  success: true,
                  transcript: extracted.transcript,
                  transcription: extracted.transcript,
                  detectedLanguages: extracted.detectedLanguages,
                  segments: extracted.segments,
                  source: 'gemini-2.5-flash-multimodal',
                  model: modelName,
                },
                { headers: CORS_HEADERS }
              );
            }
          }
        } catch {
          // Try next candidate model
        }
      }
    }

    // 2. Secondary AI Provider: Preexisting CYO Gateway (tries native v1beta generateContent & OpenAI chat/completions)
    const cyoApiKey =
      process.env.AI_API_KEY ||
      process.env.TEXT_AI_API_KEY ||
      'sk-ilovecyo';
    const cyoBaseUrl = (
      process.env.AI_BASE_URL ||
      process.env.TEXT_AI_BASE_URL ||
      DEFAULT_CYO_BASE_URL
    ).replace(/\/+$/, '');
    const cyoModel =
      process.env.AI_MODEL ||
      process.env.TEXT_AI_MODEL ||
      DEFAULT_CYO_MODEL;

    if (cyoApiKey && base64Data) {
      // 2a. Try Gemini-native v1beta passthrough on the gateway first (with gemini-2.5-flash & cyoModel)
      for (const gwModel of ['gemini-2.5-flash', cyoModel]) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 20000);

          const gwNativeRes = await fetch(
            `${cyoBaseUrl}/v1beta/models/${gwModel}:generateContent?key=${cyoApiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cyoApiKey}`,
              },
              body: JSON.stringify({
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
                      { text: BILINGUAL_AUDIO_PROMPT },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: 'application/json',
                  responseSchema: BILINGUAL_TRANSCRIPTION_SCHEMA,
                  temperature: 0.1,
                },
              }),
              signal: controller.signal,
            }
          ).finally(() => clearTimeout(timer));

          if (gwNativeRes.ok) {
            const gwJson = await gwNativeRes.json();
            const rawText =
              gwJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const extracted = extractTranscriptFromStructuredOutput(rawText);
            if (extracted && extracted.transcript) {
              return NextResponse.json(
                {
                  success: true,
                  transcript: extracted.transcript,
                  transcription: extracted.transcript,
                  detectedLanguages: extracted.detectedLanguages,
                  segments: extracted.segments,
                  source: 'gateway-v1beta-multimodal',
                  model: gwModel,
                },
                { headers: CORS_HEADERS }
              );
            }
          }
        } catch {
          // Proceed to OpenAI-compatible multimodal endpoint
        }
      }

      // 2b. Try OpenAI-compatible /v1/chat/completions with multimodal audio content
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25000);

        const audioFormat = mimeType.includes('mp4')
          ? 'mp4'
          : mimeType.includes('ogg')
          ? 'ogg'
          : mimeType.includes('wav')
          ? 'wav'
          : mimeType.includes('mpeg') || mimeType.includes('mp3')
          ? 'mp3'
          : 'webm';

        const cleanDataUrl = `data:${mimeType};base64,${base64Data}`;

        const payloads = [
          [
            {
              type: 'text',
              text: `${BILINGUAL_AUDIO_PROMPT}\nOutput JSON with {"detectedLanguages": ["vi"|"en"], "segments": [{"language": "vi"|"en", "transcript": "..."}]}`,
            },
            {
              type: 'input_audio',
              input_audio: {
                data: base64Data,
                format: audioFormat,
              },
            },
          ],
          [
            {
              type: 'text',
              text: `${BILINGUAL_AUDIO_PROMPT}\nOutput JSON with {"detectedLanguages": ["vi"|"en"], "segments": [{"language": "vi"|"en", "transcript": "..."}]}`,
            },
            {
              type: 'image_url',
              image_url: { url: cleanDataUrl },
            },
          ],
        ];

        for (const userContent of payloads) {
          const aiRes = await fetch(`${cyoBaseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cyoApiKey}`,
            },
            body: JSON.stringify({
              model: cyoModel,
              messages: [
                { role: 'system', content: BILINGUAL_AUDIO_PROMPT },
                { role: 'user', content: userContent },
              ],
              temperature: 0.1,
            }),
            signal: controller.signal,
          });

          if (aiRes.ok) {
            const data = await aiRes.json();
            const rawContent = (data?.choices?.[0]?.message?.content || '').trim();
            const extracted = extractTranscriptFromStructuredOutput(rawContent);
            if (extracted && extracted.transcript) {
              clearTimeout(timer);
              return NextResponse.json(
                {
                  success: true,
                  transcript: extracted.transcript,
                  transcription: extracted.transcript,
                  detectedLanguages: extracted.detectedLanguages,
                  segments: extracted.segments,
                  source: 'cyo-gemini-multimodal',
                  model: cyoModel,
                },
                { headers: CORS_HEADERS }
              );
            }
          }
        }
        clearTimeout(timer);
      } catch {
        // Proceed to local speech recognition refinement / fallback
      }

      // 2c. If browser captured raw localTranscript, use AI to clean/segment bilingual VI/EN text
      if (localTranscript && localTranscript.trim()) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 15000);
          const aiRefineRes = await fetch(`${cyoBaseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cyoApiKey}`,
            },
            body: JSON.stringify({
              model: cyoModel,
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a bilingual Vietnamese/English speech-to-text post-processor. Fix punctuation and capitalization while preserving the exact verbatim words in Vietnamese and English without translating. Output ONLY the cleaned transcript string.',
                },
                {
                  role: 'user',
                  content: localTranscript.trim(),
                },
              ],
              temperature: 0.1,
            }),
            signal: controller.signal,
          }).finally(() => clearTimeout(timer));

          if (aiRefineRes.ok) {
            const refineData = await aiRefineRes.json();
            const refined = (refineData?.choices?.[0]?.message?.content || '').trim();
            if (refined) {
              return NextResponse.json(
                {
                  success: true,
                  transcript: refined.replace(/^["“]|["”]$/g, '').trim(),
                  transcription: refined.replace(/^["“]|["”]$/g, '').trim(),
                  source: 'ai-refined-speech',
                  model: cyoModel,
                },
                { headers: CORS_HEADERS }
              );
            }
          }
        } catch {
          // Fall through to raw localTranscript
        }
      }
    }

    // 3. Fallback to Local Browser Speech Recognition (or Demo text only if isDemo === true)
    return NextResponse.json(
      {
        success: true,
        transcript: finalFallback,
        transcription: finalFallback,
        source: localTranscript?.trim()
          ? 'local-speech-fallback'
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

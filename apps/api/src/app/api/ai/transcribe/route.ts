import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com';
const DEFAULT_GEMINI_AUDIO_MODEL = 'gemini-1.5-flash';
const DEFAULT_CYO_BASE_URL = 'https://chat-api.chuyenbienhoa.com';
const DEFAULT_CYO_MODEL = 'gemini-flash-lite';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-family-id, x-member-id',
};

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
      description: 'Dedicated Gemini Speech-to-Text & Audio Transcription Endpoint for Nhịp Nhà',
      methods: ['GET', 'POST', 'OPTIONS'],
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
      const matches = audioUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1].split(';')[0] || 'audio/webm';
        base64Data = matches[2];
      }
    }

    const promptText =
      'You are an accurate bilingual speech-to-text recognition assistant supporting both Vietnamese (Tiếng Việt) and English. Listen to the audio and transcribe verbatim what the speaker says in the exact language they spoke (Vietnamese, English, or mixed). Output ONLY the raw spoken text without commentary, translation, quotes, or markdown. If the audio is silent or contains no speech, output NOTHING.';

    // 1. Primary: Dedicated Google Native Generative Language API (if GEMINI_AUDIO_API_KEY or GEMINI_API_KEY is configured)
    const geminiApiKey =
      process.env.GEMINI_AUDIO_API_KEY || process.env.GEMINI_API_KEY;
    const geminiBaseUrl = (
      process.env.GEMINI_AUDIO_BASE_URL ||
      process.env.GEMINI_BASE_URL ||
      DEFAULT_GEMINI_BASE_URL
    ).replace(/\/+$/, '');
    const geminiModel =
      process.env.GEMINI_AUDIO_MODEL ||
      process.env.GEMINI_MODEL ||
      DEFAULT_GEMINI_AUDIO_MODEL;

    if (geminiApiKey && base64Data) {
      try {
        if (geminiBaseUrl.includes('googleapis.com') || geminiApiKey.startsWith('AIza')) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 20000);

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      { text: promptText },
                      {
                        inlineData: {
                          mimeType,
                          data: base64Data,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: { temperature: 0.1 },
              }),
              signal: controller.signal,
            }
          ).finally(() => clearTimeout(timer));

          if (geminiRes.ok) {
            const geminiJson = await geminiRes.json();
            const recognized =
              geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (recognized) {
              return NextResponse.json(
                {
                  success: true,
                  transcript: recognized,
                  transcription: recognized,
                  source: 'gemini-native-audio',
                  model: geminiModel,
                },
                { headers: CORS_HEADERS }
              );
            }
          }
        }
      } catch {
        // Proceed to CYO AI gateway or local fallback
      }
    }

    // 2. Secondary AI Provider: Preexisting CYO AI Tool (gemini-flash-lite)
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
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);

        const audioFormat = mimeType.includes('mp4')
          ? 'mp4'
          : mimeType.includes('ogg')
          ? 'ogg'
          : mimeType.includes('wav')
          ? 'wav'
          : mimeType.includes('mpeg') || mimeType.includes('mp3')
          ? 'mp3'
          : 'webm';

        // Try OpenAI input_audio format first, and fall back to data URL image_url format
        const payloads = [
          [
            {
              type: 'text',
              text:
                localTranscript && localTranscript.trim()
                  ? `${promptText}\n(Local browser speech hint: "${localTranscript.trim()}")`
                  : promptText,
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
              text:
                localTranscript && localTranscript.trim()
                  ? `${promptText}\n(Local browser speech hint: "${localTranscript.trim()}")`
                  : promptText,
            },
            {
              type: 'image_url',
              image_url: { url: audioUrl },
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
                { role: 'system', content: promptText },
                { role: 'user', content: userContent },
              ],
              temperature: 0.1,
            }),
            signal: controller.signal,
          });

          if (aiRes.ok) {
            const data = await aiRes.json();
            const text = (data?.choices?.[0]?.message?.content || '').trim();
            const isRefusal =
              /cannot|unable|không thể|không nhận được|no audio|provide the audio|i don't have access|as an ai/i.test(
                text
              );
            if (text && !isRefusal) {
              clearTimeout(timer);
              return NextResponse.json(
                {
                  success: true,
                  transcript: text.replace(/^["“]|["”]$/g, '').trim(),
                  transcription: text.replace(/^["“]|["”]$/g, '').trim(),
                  source: 'cyo-gemini-stt',
                  model: cyoModel,
                },
                { headers: CORS_HEADERS }
              );
            }
          }
        }
        clearTimeout(timer);
      } catch {
        // Proceed to local speech recognition fallback
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

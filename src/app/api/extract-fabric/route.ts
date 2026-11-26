import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { z } from 'zod';
import { checkApiRateLimit, clientIp } from '@/lib/ratelimit';
import { AuthError, requireAdmin } from '@/lib/dal/session';
import { decodeImageDataUrl } from '@/lib/image-validation';
import { plainText } from '@/lib/validation/common';

// SEC-10: the model's answer is untrusted (a swatch photo can carry injected
// text). Every field is cut to plain text and capped before it reaches the
// admin's draft; createProduct validates again on save.
const extractedSchema = z.object({
  title: plainText(200).catch(''),
  description: plainText(5000).catch(''),
  weaveDensity: plainText(100).catch(''),
  pigment: plainText(100).catch(''),
  gsm: z.coerce.number().finite().min(0).max(5000).catch(0),
  width: plainText(50).catch(''),
  stretch: plainText(50).catch(''),
  origin: plainText(100).catch(''),
  bestSuitedFor: plainText(500).catch(''),
  print: plainText(100).catch(''),
  colors: z.array(plainText(60)).max(10).catch([]),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const fabricSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: 'A luxurious, descriptive title for the fabric (e.g. Raw Indigo Heritage Handloom).' },
    description: { type: SchemaType.STRING, description: 'A highly descriptive paragraph emphasizing the tactile, structural, and premium quality of the fabric.' },
    weaveDensity: { type: SchemaType.STRING, description: 'The detected weave structure and density (e.g. 60s x 60s Handspun, 2/1 Twill).' },
    pigment: { type: SchemaType.STRING, description: 'The dye or pigment used (e.g. 100% Fermented Indigo Extract).' },
    gsm: { type: SchemaType.INTEGER, description: 'The estimated weight in grams per square meter (e.g. 150, 320).' },
    width: { type: SchemaType.STRING, description: 'The standard width (e.g. 54 inches / 137 cm).' },
    stretch: { type: SchemaType.STRING, description: 'The stretch factor (e.g. 0% Mechanical Stretch, 2% Elastane).' },
    origin: { type: SchemaType.STRING, description: 'The artisanal origin (e.g. Mithila Artisanal Cluster, India).' },
    bestSuitedFor: { type: SchemaType.STRING, description: 'Comma separated list of garments this is best suited for (e.g. Tailored overcoats, Unlined blazers).' },
    print: { type: SchemaType.STRING, description: 'The print type if visible (e.g. Solid, Pattern, Digital Print, Hand Block, Ikat, None).' },
    colors: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING },
      description: 'A list of 2-4 descriptive color variants detected or suitable for the fabric.'
    }
  },
  required: ['title', 'description', 'weaveDensity', 'pigment', 'gsm', 'width', 'stretch', 'origin', 'bestSuitedFor', 'print', 'colors']
};

export async function POST(req: Request) {
  try {
    // Admin only: this burns paid Gemini quota.
    let admin;
    try {
      admin = await requireAdmin();
    } catch (err) {
      const code = err instanceof AuthError && err.code === 'FORBIDDEN' ? 403 : 401;
      return NextResponse.json({ error: code === 403 ? 'Forbidden' : 'Unauthorized' }, { status: code });
    }

    if (!(await checkApiRateLimit('extract-fabric:' + admin.id + ':' + clientIp(req)))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    let body: { imageBase64?: unknown; baseName?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const { imageBase64 } = body;
    const baseName = typeof body.baseName === 'string'
      ? body.baseName.replace(/[^\p{L}\p{N} .,'()-]/gu, '').slice(0, 80)
      : '';

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    let image;
    try {
      image = decodeImageDataUrl(imageBase64);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: fabricSchema,
        temperature: 0.7,
      }
    });

    const prompt = `You are an expert textile engineer and luxury brand copywriter. 
    Analyze the provided fabric swatch image to determine its physical and visual characteristics.
    Base Name (if provided): ${baseName || 'None'}. 
    Extract the required technical specifications according to the schema. Ensure the title is elegant.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image.buffer.toString('base64'),
          mimeType: image.image.contentType
        }
      }
    ]);

    let raw: unknown;
    try {
      raw = JSON.parse(result.response.text());
    } catch {
      return NextResponse.json({ error: 'Could not read the extraction result' }, { status: 502 });
    }
    const data = extractedSchema.parse(raw ?? {});

    return NextResponse.json(data);
  } catch (error) {
    console.error('Gemini Extraction Error:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to extract fabric details' }, { status: 500 });
  }
}

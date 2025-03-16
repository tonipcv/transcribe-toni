import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    
    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await writeFile(uploadsDir, '', { flag: 'wx' });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // Save audio file
    const audioBytes = await audio.arrayBuffer();
    const audioPath = path.join(uploadsDir, `${Date.now()}_${audio.name}`);
    await writeFile(audioPath, Buffer.from(audioBytes));

    try {
      // Convert File to Blob and then to Buffer for OpenAI API
      const audioBuffer = Buffer.from(await audio.arrayBuffer());
      
      // Transcribe audio using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], audio.name, { type: audio.type }),
        model: 'whisper-1',
      });

      // Save transcription to database
      const savedTranscription = await prisma.transcription.create({
        data: {
          content: transcription.text,
          type: 'audio',
          fileName: audio.name,
          fileSize: audio.size,
        }
      });

      // Clean up file
      await unlink(audioPath);

      return NextResponse.json({ 
        success: true, 
        transcription: transcription.text,
        id: savedTranscription.id
      });
    } catch (error: any) {
      console.error('Error transcribing audio:', error.message);
      if (error.status === 401) {
        throw new Error('Invalid or expired OpenAI API key. Please check your API key configuration.');
      }
      throw error;
    }

  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Error processing audio' },
      { status: 500 }
    );
  }
}

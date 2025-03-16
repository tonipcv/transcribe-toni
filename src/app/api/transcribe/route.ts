import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    
    if (!video) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await createDirectory(uploadsDir);

    // Save video file
    const videoBytes = await video.arrayBuffer();
    const videoPath = path.join(uploadsDir, `${Date.now()}_${video.name}`);
    await writeFile(videoPath, Buffer.from(videoBytes));

    // Convert video to audio using FFmpeg
    const audioPath = path.join(uploadsDir, `${Date.now()}_output.mp3`);
    
    try {
      // Use system FFmpeg to convert video to audio
      await execAsync(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame "${audioPath}"`);
    } catch (error) {
      console.error('Error converting video to audio:', error);
      throw error;
    }

    // Transcribe audio using OpenAI Whisper
    let transcription;
    try {
      transcription = await openai.audio.transcriptions.create({
        file: await fileFromPath(audioPath),
        model: 'whisper-1',
      });
    /* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (error: any) {
    /* eslint-enable @typescript-eslint/no-explicit-any */
      console.error('Error transcribing audio:', error.message);
      if (error.status === 401) {
        throw new Error('Invalid or expired OpenAI API key. Please check your API key configuration.');
      }
      throw error;
    }

    // Save transcription to database
    const savedTranscription = await prisma.transcription.create({
      data: {
        content: transcription.text,
        type: 'video',
        fileName: video.name,
        fileSize: video.size,
      }
    });

    // Clean up files
    await cleanup(videoPath, audioPath);

    return NextResponse.json({ 
      success: true, 
      transcription: transcription.text,
      id: savedTranscription.id
    });

  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { error: 'Error processing video' },
      { status: 500 }
    );
  }
}

async function createDirectory(dir: string) {
  try {
    await writeFile(dir, '', { flag: 'wx' });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function fileFromPath(filePath: string) {
  const content = await readFile(filePath);
  return new File([content], path.basename(filePath));
}

async function cleanup(...paths: string[]) {
  for (const path of paths) {
    try {
      await unlink(path);
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error);
    }
  }
}

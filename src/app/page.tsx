'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedOption, setSelectedOption] = useState<'initial' | 'video' | 'audio'>('initial');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  // Efeito para gerenciar o timer de gravação
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Error accessing microphone. Please make sure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const submitAudio = async () => {
    if (!audioBlob) {
      setError('No audio recording available');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('audio', new File([audioBlob], 'recording.webm', { type: 'audio/webm' }));

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe audio');
      }

      setTranscription(data.transcription);
      setAudioBlob(null); // Clear the recorded audio after successful upload
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe video');
      }

      setTranscription(data.transcription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const response = await fetch('/api/logout', {
      method: 'POST',
    });

    if (response.ok) {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', position: 'relative' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'rgba(17, 24, 39, 0.4)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>
            Transcriber App
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => router.push('/history')}
              className="button-secondary"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem'
              }}
            >
              <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Histórico
            </button>
            <button
              onClick={handleLogout}
              className="button-secondary"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                color: '#f87171',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem'
              }}
            >
              <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
        </header>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="heading" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Audio & Video Transcriber
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#9ca3af' }}>
            Convert your media to text using OpenAI Whisper
          </p>
        </div>

        <div className="card" style={{ padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
          {selectedOption === 'initial' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                textAlign: 'center', 
                color: 'white', 
                marginBottom: '2rem' 
              }}>
                What would you like to transcribe?
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem' 
              }}>
                <button
                  onClick={() => setSelectedOption('video')}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '1.5rem', 
                    border: '2px solid #374151', 
                    borderRadius: '0.5rem', 
                    transition: 'all 0.2s ease',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#374151'}
                >
                  <svg style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    color: '#9ca3af', 
                    marginBottom: '1rem' 
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '500', 
                    color: 'white' 
                  }}>Video File</span>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#9ca3af', 
                    marginTop: '0.5rem', 
                    textAlign: 'center' 
                  }}>Upload a video file for transcription</p>
                </button>

                <button
                  onClick={() => setSelectedOption('audio')}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '1.5rem', 
                    border: '2px solid #374151', 
                    borderRadius: '0.5rem', 
                    transition: 'all 0.2s ease',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#374151'}
                >
                  <svg style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    color: '#9ca3af', 
                    marginBottom: '1rem' 
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '500', 
                    color: 'white' 
                  }}>Record Audio</span>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#9ca3af', 
                    marginTop: '0.5rem', 
                    textAlign: 'center' 
                  }}>Record audio directly from your microphone</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <button
                  onClick={() => {
                    setSelectedOption('initial');
                    setFile(null);
                    setAudioBlob(null);
                    setTranscription('');
                    setError('');
                  }}
                  className="button-secondary animate-fade-in"
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Voltar
                </button>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: 'white' 
                }}>
                  {selectedOption === 'video' ? 'Upload de Vídeo' : 'Gravação de Áudio'}
                </h2>
              </div>

              {selectedOption === 'video' ? (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      padding: '2rem 1.5rem', 
                      border: '2px dashed #4b5563', 
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgba(17, 24, 39, 0.4)',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <svg style={{ 
                          width: '3rem', 
                          height: '3rem', 
                          color: '#9ca3af', 
                          margin: '0 auto 1rem auto' 
                        }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label htmlFor="file-upload" style={{ 
                            cursor: 'pointer', 
                            backgroundColor: 'rgba(79, 70, 229, 0.1)', 
                            borderRadius: '0.375rem', 
                            fontWeight: '500', 
                            color: '#818cf8', 
                            padding: '0.5rem 1rem',
                            display: 'inline-block',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(79, 70, 229, 0.2)'
                          }} className="hover-effect">
                            <span>Selecionar vídeo</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept="video/*"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        <p style={{ 
                          fontSize: '0.75rem', 
                          color: '#9ca3af',
                          marginTop: '0.5rem'
                        }}>
                          MP4, MOV ou AVI até 100MB
                        </p>
                        {file && (
                          <div style={{ 
                            marginTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid rgba(79, 70, 229, 0.2)'
                          }}>
                            <svg style={{ width: '1.25rem', height: '1.25rem', color: '#818cf8', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span style={{ 
                              fontSize: '0.875rem', 
                              color: '#818cf8',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="animate-fade-in" style={{ 
                        marginTop: '0.5rem', 
                        backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                        borderLeft: '4px solid #ef4444', 
                        padding: '0.75rem',
                        borderRadius: '0 0.25rem 0.25rem 0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <svg style={{ height: '1.25rem', width: '1.25rem', color: '#ef4444', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p style={{ fontSize: '0.875rem', color: '#fca5a5' }}>{error}</p>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                      <button
                        type="submit"
                        disabled={loading || !file}
                        className="button-primary animate-fade-in"
                        style={{ 
                          opacity: loading || !file ? '0.5' : '1',
                          cursor: loading || !file ? 'not-allowed' : 'pointer',
                          padding: '0.75rem 1.5rem',
                          fontSize: '1rem'
                        }}
                      >
                        {loading ? (
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="animate-spin" style={{ 
                              display: 'inline-block',
                              width: '1.25rem', 
                              height: '1.25rem', 
                              borderRadius: '9999px', 
                              borderWidth: '2px', 
                              borderStyle: 'solid', 
                              borderColor: 'transparent', 
                              borderTopColor: 'white',
                              marginRight: '0.75rem'
                            }}></span>
                            Processando...
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Transcrever Vídeo
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="animate-fade-in" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '2rem',
                  maxWidth: '32rem',
                  margin: '0 auto',
                  padding: '2rem',
                  backgroundColor: 'rgba(17, 24, 39, 0.4)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '600', 
                      color: 'white', 
                      marginBottom: '0.5rem' 
                    }}>
                      Gravação de Áudio
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      {isRecording 
                        ? 'Gravando... Clique no botão para parar quando terminar.' 
                        : audioBlob 
                          ? 'Áudio gravado com sucesso! Você pode reproduzir abaixo ou gravar novamente.' 
                          : 'Clique no botão abaixo para iniciar a gravação de áudio'}
                    </p>
                  </div>
                  
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    width: '100%'
                  }}>
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      style={{ 
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '5rem',
                        height: '5rem',
                        borderRadius: '9999px',
                        transition: 'all 0.2s ease-in-out',
                        transform: 'scale(1)',
                        backgroundColor: isRecording ? 'var(--error)' : audioBlob ? '#10b981' : 'var(--primary)',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                      className="hover-effect"
                      aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
                    >
                      {isRecording ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ position: 'absolute', inset: 0, borderRadius: '9999px' }}>
                            <span style={{ 
                              position: 'absolute', 
                              inset: 0, 
                              borderRadius: '9999px', 
                              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                              backgroundColor: 'rgba(248, 113, 113, 0.75)'
                            }}></span>
                          </div>
                          <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                        </div>
                      ) : audioBlob ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                      )}
                    </button>
                    
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: 'white',
                      backgroundColor: isRecording 
                        ? 'rgba(220, 38, 38, 0.1)' 
                        : audioBlob 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : 'rgba(79, 70, 229, 0.1)',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: isRecording 
                        ? '1px solid rgba(220, 38, 38, 0.2)' 
                        : audioBlob 
                          ? '1px solid rgba(16, 185, 129, 0.2)' 
                          : '1px solid rgba(79, 70, 229, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {isRecording && (
                        <span style={{ 
                          width: '0.75rem', 
                          height: '0.75rem', 
                          backgroundColor: '#ef4444',
                          borderRadius: '9999px',
                          display: 'inline-block',
                          animation: 'pulse 2s infinite'
                        }}></span>
                      )}
                      {isRecording 
                        ? `Gravando... ${recordingTime}s` 
                        : audioBlob 
                          ? 'Reproduzir gravação' 
                          : 'Iniciar Gravação'}
                    </div>
                  </div>

                  {audioBlob && (
                    <div style={{ 
                      width: '100%', 
                      backgroundColor: 'rgba(31, 41, 55, 0.5)', 
                      borderRadius: '0.5rem', 
                      padding: '1rem',
                      marginTop: '1rem',
                      border: '1px solid rgba(75, 85, 99, 0.2)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'white' }}>Áudio Gravado</h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Pronto para transcrição</span>
                      </div>
                      
                      <div style={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.5)', 
                        borderRadius: '0.375rem', 
                        padding: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <audio 
                          controls 
                          src={URL.createObjectURL(audioBlob)} 
                          style={{ 
                            width: '100%',
                            height: '2.5rem',
                            borderRadius: '0.25rem'
                          }} 
                        />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setAudioBlob(null);
                            setRecordingTime(0);
                          }}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          className="hover-effect"
                        >
                          <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Descartar
                        </button>
                        
                        <button
                          type="button"
                          onClick={submitAudio}
                          disabled={loading}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            backgroundColor: loading ? 'rgba(79, 70, 229, 0.5)' : 'var(--primary)',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? '0.7' : '1',
                            transition: 'all 0.2s ease',
                            flexGrow: 1,
                            justifyContent: 'center'
                          }}
                          className="hover-effect"
                        >
                          {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ 
                                display: 'inline-block',
                                width: '1rem', 
                                height: '1rem', 
                                borderRadius: '9999px', 
                                borderWidth: '2px', 
                                borderStyle: 'solid', 
                                borderColor: 'transparent', 
                                borderTopColor: 'white',
                                animation: 'spin 1s linear infinite'
                              }}></span>
                              Processando...
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              Transcrever Áudio
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transcription Output */}
              {transcription && (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Transcription
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {transcription}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

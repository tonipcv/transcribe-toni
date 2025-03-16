'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Transcription = {
  id: string;
  content: string;
  type: string;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranscriptions();
  }, []);

  const fetchTranscriptions = async () => {
    try {
      const response = await fetch('/api/transcriptions');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setTranscriptions(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <h1 className="heading" style={{ fontSize: '2.25rem' }}>
            Histórico de Transcrições
          </h1>
          <button
            onClick={() => router.push('/')}
            className="button-primary"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
        </div>

        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '16rem' 
          }}>
            <div className="animate-spin" style={{ 
              height: '3rem', 
              width: '3rem', 
              borderRadius: '9999px', 
              borderWidth: '2px', 
              borderStyle: 'solid', 
              borderColor: 'transparent', 
              borderTopColor: 'var(--primary)', 
              borderBottomColor: 'var(--primary)' 
            }}></div>
          </div>
        ) : transcriptions.length === 0 ? (
          <div className="card animate-fade-in" style={{ 
            textAlign: 'center', 
            padding: '3rem' 
          }}>
            <svg style={{ 
              margin: '0 auto', 
              height: '3rem', 
              width: '3rem', 
              color: '#9ca3af' 
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'white' 
            }}>Nenhuma transcrição encontrada</h3>
            <p style={{ 
              marginTop: '0.25rem', 
              fontSize: '0.875rem', 
              color: '#9ca3af' 
            }}>
              Comece fazendo upload de um vídeo ou gravando um áudio.
            </p>
          </div>
        ) : (
          <div className="card animate-fade-in" style={{ 
            overflow: 'hidden', 
            borderRadius: '0.5rem' 
          }}>
            <ul style={{ 
              borderTop: '1px solid rgba(55, 65, 81, 0.5)' 
            }}>
              {transcriptions.map((transcription) => (
                <li key={transcription.id} style={{ 
                  padding: '1.5rem', 
                  borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
                  transition: 'all 0.2s ease'
                }} className="animate-slide-up hover-effect">
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'space-between' 
                  }}>
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          backgroundColor: transcription.type === 'video' ? 'rgba(147, 51, 234, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                          color: transcription.type === 'video' ? '#c084fc' : '#93c5fd'
                        }}>
                          {transcription.type === 'video' ? 'Vídeo' : 'Áudio'}
                        </span>
                        {transcription.fileName && (
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: '#e5e7eb',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%'
                          }}>
                            {transcription.fileName}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.5rem'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          fontSize: '0.75rem', 
                          color: '#9ca3af' 
                        }}>
                          <svg style={{ 
                            flexShrink: '0', 
                            marginRight: '0.375rem', 
                            height: '1rem', 
                            width: '1rem' 
                          }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(transcription.createdAt)}</span>
                        </div>
                        
                        {transcription.fileSize && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            fontSize: '0.75rem', 
                            color: '#9ca3af' 
                          }}>
                            <svg style={{ 
                              flexShrink: '0', 
                              marginRight: '0.375rem', 
                              height: '1rem', 
                              width: '1rem' 
                            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{formatFileSize(transcription.fileSize)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ 
                        marginTop: '1rem', 
                        backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                        padding: '0.75rem', 
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(55, 65, 81, 0.5)'
                      }}>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#e5e7eb', 
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.5'
                        }}>
                          {transcription.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

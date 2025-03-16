'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    // Efeito de foco automático no campo de senha quando a página carrega
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.focus();
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password');
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
      console.error('Erro ao fazer login:', err);
    } finally {
      setLoading(false);
    }
  }
  
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  }

  return (
    <div className="gradient-bg" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card" style={{ 
        maxWidth: '24rem', 
        width: '100%', 
        padding: '2rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '1.5rem', 
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: 'white'
          }}>
            Área Restrita
          </h2>
          <p style={{ 
            textAlign: 'center', 
            color: '#9ca3af', 
            fontSize: '0.875rem' 
          }}>
            Digite a senha para acessar o sistema
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.25rem'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 0.875rem', 
                  paddingRight: '2.5rem',
                  borderRadius: '0.375rem', 
                  backgroundColor: 'rgba(17, 24, 39, 0.5)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: '#e5e7eb', 
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Digite a senha"
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0.25rem'
                }}
              >
                {passwordVisible ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="button-primary"
              disabled={loading}
              style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: '0.75rem 0.875rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                transition: 'all 0.2s ease',
                backgroundColor: '#4f46e5',
                borderRadius: '0.375rem',
                border: 'none',
                opacity: loading ? '0.7' : '1',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          
          {error && (
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#f87171',
              margin: 0,
              textAlign: 'center'
            }} role="alert">
              Senha incorreta. Tente novamente.
            </p>
          )}
        </form>
        
        <p style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          fontSize: '0.7rem',
          marginTop: '0.5rem'
        }}>
          © {new Date().getFullYear()} Transcriber App
        </p>
      </div>
    </div>
  );
}

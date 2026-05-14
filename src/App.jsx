import { useState, useEffect } from 'react';
import './index.css';

// O Vite exige o prefixo VITE_ para que as variáveis sejam injetadas no cliente
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID; 
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = window.location.hostname === 'localhost' 
  ? 'http://localhost:5173/callback' 
  : 'https://spotimix.fvds.dev/callback';

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('spotify_token');
    if (savedToken) {
      setToken(savedToken);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      if (!SPOTIFY_CLIENT_SECRET) {
        console.error("VITE_SPOTIFY_CLIENT_SECRET não configurada!");
        return;
      }

      const payload = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI
        }),
      };

      fetch("https://accounts.spotify.com/api/token", payload)
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            localStorage.setItem('spotify_token', data.access_token);
            setToken(data.access_token);
            window.history.replaceState(null, '', window.location.pathname);
          }
        })
        .catch(err => console.error("Erro na requisição de token", err));
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const handleLogin = () => {
    const scope = 'user-read-private user-read-email user-read-recently-played playlist-modify-public playlist-modify-private';
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_token');
    setToken(null);
    setUser(null);
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <div className="app-container animate-fade-in">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2><span className="text-gradient">SpotiMix</span></h2>
          <button className="btn" onClick={handleLogout} style={{ backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
            Sair
          </button>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando perfil...</p>
          ) : user ? (
            <div className="card animate-fade-in" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
              {user.images?.[0] ? (
                <img src={user.images[0].url} alt={user.display_name} style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem', border: '4px solid var(--primary)' }} />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 1.5rem auto' }}>
                  👤
                </div>
              )}
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Olá, {user.display_name}! ✨</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Conectado com sucesso ao SpotiMix.</p>
              
              <div style={{ backgroundColor: 'rgba(29, 185, 84, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#1DB954', fontWeight: '500' }}>
                Pronto para gerar sua próxima playlist.
              </div>
            </div>
          ) : null}
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} className="animate-fade-in">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          🎧✨
        </div>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          <span className="text-gradient">SpotiMix</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '500px', marginBottom: '3rem', lineHeight: '1.6' }}>
          Acesse para visualizar seu perfil e preparar sua curadoria musical.
        </p>
        <button className="btn btn-primary" onClick={handleLogin} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          Conectar ao Spotify
        </button>
      </main>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import './index.css';

const SPOTIFY_CLIENT_ID = '7412257ac88b425980fc54ce430f2f36'; 
const SPOTIFY_CLIENT_SECRET = '62f549ef71704fd08cd04603da577269';
const REDIRECT_URI = window.location.hostname === 'localhost' 
  ? 'http://localhost:5173/callback' 
  : 'https://spotmix.fvds.dev/callback';

function App() {
  const [token, setToken] = useState(null);
  const [history, setHistory] = useState([]);
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
          } else {
            console.error("Erro ao pegar token", data);
          }
        })
        .catch(err => console.error("Erro na requisição de token", err));
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const handleLogin = () => {
    const scope = 'user-read-recently-played playlist-modify-public playlist-modify-private';
    
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_token');
    setToken(null);
    setHistory([]);
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      
      if (data.items) {
        setHistory(data.items);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
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

        <main style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Últimas Músicas Ouvidas no Spotify 🚀</h3>
          
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando seu histórico...</p>
          ) : history.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {history.map((item, index) => {
                const track = item.track;
                return (
                  <div key={`${track.id}-${index}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                    {track.album.images[0] && (
                      <img src={track.album.images[0].url} alt={track.album.name} style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)' }} />
                    )}
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{track.name}</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{track.artists.map(a => a.name).join(', ')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Nenhuma música encontrada no seu histórico recente.</p>
          )}
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
          Gere playlists incríveis combinando seus gêneros favoritos com as músicas que você não consegue parar de ouvir.
        </p>
        <button className="btn btn-primary" onClick={handleLogin} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          Conectar ao Spotify
        </button>
      </main>
    </div>
  );
}

export default App;

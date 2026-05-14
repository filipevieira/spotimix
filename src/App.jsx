import { useState, useEffect } from 'react';
import './index.css';

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '7412257ac88b425980fc54ce430f2f36'; 
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = window.location.hostname === 'localhost' 
  ? 'http://localhost:5173/callback' 
  : 'https://spotimix.fvds.dev/callback';

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

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
      fetchGenres();
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
    setGenres([]);
    setSelectedGenres([]);
    setRecommendations([]);
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) return handleLogout();
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
    }
  };

  const fetchGenres = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setGenres(data.genres || []);
    } catch (error) {
      console.error("Erro ao buscar gêneros:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < 5) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const generateMix = async () => {
    if (selectedGenres.length === 0) return;
    setGenerating(true);
    try {
      // Passo 1: Pegar as últimas 2 faixas ouvidas para usar como sementes
      const historyRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=2', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      const seedTracks = historyData.items?.map(item => item.track.id).join(',') || '';

      // Passo 2: Gerar recomendações baseadas nos gêneros (3) e faixas (2)
      // Spotify aceita no máximo 5 sementes totais.
      const genreSeeds = selectedGenres.slice(0, 3).join(',');
      const url = `https://api.spotify.com/v1/recommendations?limit=15&seed_genres=${genreSeeds}&seed_tracks=${seedTracks}`;
      
      const recRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recData = await recRes.json();
      setRecommendations(recData.tracks || []);
    } catch (error) {
      console.error("Erro ao gerar mix:", error);
    } finally {
      setGenerating(false);
    }
  };

  if (token) {
    return (
      <div className="app-container animate-fade-in">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2><span className="text-gradient">SpotiMix</span></h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {user && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{user.display_name}</span>}
            <button className="btn" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Sair</button>
          </div>
        </header>

        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Qual é a vibe de hoje?</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Escolha até 3 gêneros para misturarmos com o seu histórico recente.</p>

          <div className="genre-container">
            {genres.map(genre => (
              <div 
                key={genre} 
                className={`genre-chip ${selectedGenres.includes(genre) ? 'selected' : ''}`}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </div>
            ))}
          </div>

          <button 
            className="btn btn-primary" 
            onClick={generateMix}
            disabled={selectedGenres.length === 0 || generating}
            style={{ marginTop: '2rem', minWidth: '200px' }}
          >
            {generating ? 'Misturando...' : 'Gerar Meu Mix 🚀'}
          </button>

          {recommendations.length > 0 && (
            <div className="track-list animate-fade-in">
              <h3 style={{ margin: '3rem 0 1.5rem 0', textAlign: 'left' }}>Seu Mix Sugerido:</h3>
              {recommendations.map(track => (
                <div key={track.id} className="track-card">
                  <img src={track.album.images[2]?.url} alt={track.name} className="track-img" />
                  <div className="track-info">
                    <h4>{track.name}</h4>
                    <p>{track.artists.map(a => a.name).join(', ')}</p>
                  </div>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }}>
                Salvar como Playlist no Spotify 🎵
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} className="animate-fade-in">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎧✨</div>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}><span className="text-gradient">SpotiMix</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '500px', marginBottom: '3rem' }}>
          Gere playlists perfeitas baseadas no seu gosto musical.
        </p>
        <button className="btn btn-primary" onClick={handleLogin}>Conectar ao Spotify</button>
      </main>
    </div>
  );
}

export default App;

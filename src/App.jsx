import { useState, useEffect } from 'react';
import './index.css';

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '7412257ac88b425980fc54ce430f2f36'; 
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = window.location.hostname === 'localhost' 
  ? 'http://localhost:5173/callback' 
  : 'https://spotimix.fvds.dev/callback';

// Lista local de gêneros para substituir a API depreciada
const POPULAR_GENRES = [
  "acoustic", "afrobeat", "alt-rock", "alternative", "ambient", "anime",
  "blues", "bossanova", "brazil", "chill", "classical", "club", "comedy", "country", "dance", 
  "deep-house", "disco", "disney", "drum-and-bass", "dubstep", "edm", "electro", "electronic", 
  "folk", "forro", "funk", "gospel", "grunge", "hard-rock", "heavy-metal", "hip-hop", "house", 
  "indie", "indie-pop", "j-pop", "jazz", "k-pop", "latin", "latino", "metal", "metalcore", 
  "mpb", "new-release", "pagode", "party", "piano", "pop", "punk", "punk-rock", "r-n-b", 
  "reggae", "reggaeton", "road-trip", "rock", "rock-n-roll", "romance", "sad", "salsa", 
  "samba", "sertanejo", "show-tunes", "singer-songwriter", "soul", "soundtracks", "study", 
  "summer", "synth-pop", "techno", "trance", "work-out", "world-music"
];

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPlaylistUrl, setSavedPlaylistUrl] = useState(null);
  const [error, setError] = useState(null);

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
        setError("Erro: VITE_SPOTIFY_CLIENT_SECRET não configurada no servidor.");
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
          } else if (data.error) {
            setError(`Erro no Token: ${data.error_description || data.error}`);
          }
        })
        .catch(err => setError("Erro na conexão com o Spotify para obter token."));
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
      // Em vez de chamar a API 404, carregamos a lista interna
      setGenres(POPULAR_GENRES.sort());
    }
  }, [token]);

  const handleLogin = () => {
    setError(null);
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
    setSavedPlaylistUrl(null);
    setError(null);
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

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const generateMix = async () => {
    if (selectedGenres.length === 0) return;
    setGenerating(true);
    setError(null);
    setRecommendations([]);
    setSavedPlaylistUrl(null);
    
    try {
      let mixTracks = [];

      // 1. Pegar histórico (Últimas músicas ouvidas)
      const historyRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const recentTracks = historyData.items?.map(item => item.track) || [];
        
        // Evitar duplicadas no histórico
        const uniqueRecent = [];
        const seenIds = new Set();
        for (const track of recentTracks) {
            if (!seenIds.has(track.id)) {
                seenIds.add(track.id);
                uniqueRecent.push(track);
            }
        }
        mixTracks = [...mixTracks, ...uniqueRecent.slice(0, 5)];
      }

      // 2. Buscar músicas baseadas nos gêneros selecionados
      for (const genre of selectedGenres) {
          const searchRes = await fetch(`https://api.spotify.com/v1/search?q=genre:"${genre}"&type=track&limit=10`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.tracks && searchData.tracks.items) {
                  mixTracks = [...mixTracks, ...searchData.tracks.items];
              }
          }
      }

      // 3. Mesclar e remover qualquer duplicidade geral
      const finalUniqueTracks = [];
      const finalSeenIds = new Set();
      for (const track of mixTracks) {
          if (track && track.id && !finalSeenIds.has(track.id)) {
              finalSeenIds.add(track.id);
              finalUniqueTracks.push(track);
          }
      }

      // 4. Embaralhar a lista (Shuffle) e pegar 15
      const shuffled = finalUniqueTracks.sort(() => 0.5 - Math.random());
      const finalMix = shuffled.slice(0, 15);

      if (finalMix.length > 0) {
        setRecommendations(finalMix);
      } else {
        setError("O Spotify não encontrou músicas para essa combinação. Tente outros gêneros!");
      }
    } catch (error) {
      setError("Erro ao gerar seu mix musical.");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const savePlaylist = async () => {
    if (!user || recommendations.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      // 1. Criar Playlist vazia
      const createRes = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `SpotiMix: ${selectedGenres.join(', ')}`,
          description: 'Playlist gerada magicamente pelo SpotiMix com base nos seus gêneros favoritos e histórico recente.',
          public: false
        })
      });
      
      if (!createRes.ok) throw new Error("Erro ao criar playlist no Spotify.");
      const playlistData = await createRes.json();

      // 2. Adicionar as faixas geradas
      const trackUris = recommendations.map(track => track.uri);
      const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
      });

      if (!addRes.ok) throw new Error("Erro ao adicionar músicas à playlist.");
      
      setSavedPlaylistUrl(playlistData.external_urls.spotify);
    } catch (err) {
      console.error(err);
      setError("Falha ao salvar a playlist. Verifique se deu permissão na hora do login.");
    } finally {
      setSaving(false);
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

          {error && (
            <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#ff4444', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', width: '100%', maxWidth: '500px' }}>
              {error}
            </div>
          )}

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
              {recommendations.map((track, idx) => (
                <div key={`${track.id}-${idx}`} className="track-card">
                  <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt={track.name} className="track-img" />
                  <div className="track-info">
                    <h4>{track.name}</h4>
                    <p>{track.artists.map(a => a.name).join(', ')}</p>
                  </div>
                </div>
              ))}
              
              {savedPlaylistUrl ? (
                <div style={{ marginTop: '2rem', padding: '20px', backgroundColor: 'rgba(29, 185, 84, 0.1)', borderRadius: '15px', border: '1px solid var(--primary)' }}>
                  <h3 style={{ color: 'var(--primary)', margin: '0 0 10px 0' }}>🎉 Playlist Criada com Sucesso!</h3>
                  <a href={savedPlaylistUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>
                    Ouvir no Spotify
                  </a>
                </div>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={savePlaylist}
                  disabled={saving}
                  style={{ marginTop: '2rem', width: '100%' }}
                >
                  {saving ? 'Salvando na sua conta...' : 'Salvar como Playlist no Spotify 🎵'}
                </button>
              )}
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
        
        {error && <div style={{ color: '#ff4444', marginBottom: '1rem' }}>{error}</div>}

        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '500px', marginBottom: '3rem' }}>
          Gere playlists perfeitas baseadas no seu gosto musical.
        </p>
        <button className="btn btn-primary" onClick={handleLogin}>Conectar ao Spotify</button>
      </main>
    </div>
  );
}

export default App;

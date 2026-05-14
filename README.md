<div align="center">
  
# 🎧 SpotiMix

**Gere playlists incríveis combinando seus gêneros favoritos com as músicas que você não consegue parar de ouvir.**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Spotify](https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white)](https://developer.spotify.com/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

</div>

## 📖 O que é o SpotiMix?

O **SpotiMix** é um aplicativo web focado em curadoria musical inteligente. Ele usa a **API Oficial do Spotify** para ler o seu histórico de músicas recém-escutadas e cruza essas informações com Gêneros Musicais que você seleciona, criando uma nova playlist perfeitamente alinhada com o seu humor (Vibe) atual.

Tudo isso rodando em uma interface com **Dark Mode Premium**, inspirada no Google Material Design e focada na melhor experiência de usuário.

## ✨ Funcionalidades

- **Autenticação Segura (OAuth 2.0)**: Login integrado e invisível através do seu próprio Spotify (Standard Authorization Flow).
- **Leitura de Histórico**: Carrega automaticamente as últimas músicas que você escutou.
- **Motor de Recomendação Inteligente**: Usa as sementes do seu histórico (`seed_tracks`) e os gêneros escolhidos (`seed_genres`) para o próprio Spotify recomendar faixas com precisão.
- **Criação Automática**: Um clique e a playlist é montada e salva diretamente na sua biblioteca do Spotify.
- **Frontend SPA**: Zero necessidade de backend para as rotinas complexas, processado 100% no seu navegador.

---

## 🛠️ Tecnologias e Arquitetura

O projeto foi planejado para ser flexível e de fácil hospedagem:

* **Frontend**: React.js encapsulado e compilado ultra-rápido usando [Vite](https://vitejs.dev/).
* **Estilização**: Vanilla CSS robusto com Design System de variáveis focadas em Dark Mode (`#1c1f26`) e verde vibrante do Spotify (`#1DB954`).
* **Gerenciamento de Estado**: React Hooks nativos e persistência de Tokens via `localStorage`.
* **CI/CD**: Automação pronta com GitHub Actions (`deploy.yml`) para *GitHub Pages*.
* **IaC / Containers**: Arquivo `docker-compose.yml` pré-configurado com automação de *health check* para provisionamento em servidores *Portainer / NGINX*.

---

## 🚀 Como rodar localmente (Desenvolvimento)

1. Clone o repositório:
```bash
git clone https://github.com/filipevieira/spotimix.git
cd spotimix
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador:
`http://localhost:5173`

*(Nota: Para o login funcionar localmente, a URI `http://localhost:5173/callback` deve estar cadastrada nas configurações do seu App no [Dashboard de Desenvolvedor do Spotify](https://developer.spotify.com/dashboard)).*

---

## 📦 Como fazer o Deploy

Você tem dois caminhos mapeados no projeto:

### Opção 1: Docker (NGINX / Portainer)
O projeto conta com um `docker-compose.yml` que sobe um contêiner NGINX leve, mapeando volumes absolutos para hospedar os arquivos estáticos de produção.
Basta compilar os arquivos e eles estarão prontos para o NGINX:
```bash
npm run build
```
*(Os arquivos de produção serão jogados na pasta `/html` configurada no Vite).*

### Opção 2: GitHub Pages (Automático)
Qualquer novo commit aprovado na branch principal irá disparar um Github Action que compila e hospeda o aplicativo usando o poder dos servidores globais do GitHub via seu domínio configurado.

---
<div align="center">
  <p>Feito com ❤️ e 🎵 para modernizar sua biblioteca musical.</p>
</div>

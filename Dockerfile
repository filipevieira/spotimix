# Estágio 1: Build da aplicação React com Vite
FROM node:20-alpine as build

# Definindo argumentos que podem ser passados durante o build
ARG VITE_SPOTIFY_CLIENT_ID
ARG VITE_SPOTIFY_CLIENT_SECRET

# Tornando os argumentos disponíveis como variáveis de ambiente para o Vite
ENV VITE_SPOTIFY_CLIENT_ID=$VITE_SPOTIFY_CLIENT_ID
ENV VITE_SPOTIFY_CLIENT_SECRET=$VITE_SPOTIFY_CLIENT_SECRET

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio 2: Servir a aplicação estática com NGINX
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/html /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

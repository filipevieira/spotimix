# Estágio 1: Build da aplicação React com Vite
FROM node:20-alpine as build

# Recebe os argumentos com os nomes que você definiu no Portainer
ARG SPOTIFY_CLIENT_ID
ARG SPOTIFY_CLIENT_SECRET

# Mapeia esses argumentos para o formato VITE_ que o código React exige
ENV VITE_SPOTIFY_CLIENT_ID=$SPOTIFY_CLIENT_ID
ENV VITE_SPOTIFY_CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET

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

# Estágio 1: Build da aplicação React com Vite
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio 2: Servir a aplicação estática com NGINX
FROM nginx:alpine
# Copia as configurações do NGINX para suportar SPA (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copia os arquivos compilados (que configuramos para ir para a pasta 'html')
COPY --from=build /app/html /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

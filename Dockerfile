# Usa imagem oficial Node.js 20 (leve e compatível com Baileys)
FROM node:20-alpine

# Instala git (necessário para dependências que vêm do GitHub)
RUN apk add --no-cache git

# Diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências (modo produção)
RUN npm install --production

# Copia o restante do código
COPY . .

# Garante que a pasta de autenticação exista
RUN mkdir -p /app/auth_info_baileys

# Expõe porta (opcional, útil para healthcheck do Render)
EXPOSE 3000

# Comando para iniciar o bot
CMD ["npm", "start"]

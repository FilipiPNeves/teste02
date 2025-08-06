# Use imagem oficial Node.js LTS (16 ou superior, conforme package.json)
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install --production

# Copia o restante do código
COPY . .

# Garante que a pasta de autenticação exista (será usada como volume externo)
RUN mkdir -p /app/auth_info_baileys

# Expõe porta (caso precise para healthcheck, não obrigatório para WhatsApp)
EXPOSE 3000

# Comando para rodar o bot
CMD ["npm", "start"]
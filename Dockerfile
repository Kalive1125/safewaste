# Imagem base oficial do Node.js LTS
FROM node:20-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json ./
COPY backend/package*.json ./backend/

# Instalar dependências de produção
RUN npm run postinstall

# Copiar todo o código-fonte
COPY . .

# Executar geração de documentos iniciais
RUN cd backend && node ./scripts/sync_all_pdfs.js

# Expor a porta da aplicação (definida dinamicamente no Cloud)
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

# Comando de inicialização
CMD ["npm", "start"]

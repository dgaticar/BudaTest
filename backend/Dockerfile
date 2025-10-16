# Usar Node.js LTS
FROM node:20-alpine

# Crear directorio de trabajo en el contenedor
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar todo el proyecto
COPY . .

# Exponer puerto en el que corre tu backend
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "src/index.js"]

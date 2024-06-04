# Utilise une image Node.js basée sur Debian
FROM node:22-slim

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie les fichiers package.json et pnpm-lock.yaml (si vous en avez un) dans le répertoire de travail
COPY package.json pnpm-lock.yaml* ./

# Installe pnpm globalement dans votre image
RUN npm install -g pnpm

# Installe les dépendances du projet
RUN pnpm install

# Copie le reste des fichiers du projet dans le répertoire de travail
COPY . .

# Construit le projet
RUN pnpm run build

# Expose le port sur lequel votre application s'exécute
EXPOSE 3000

# Démarre l'application
CMD ["pnpm", "run", "start"]
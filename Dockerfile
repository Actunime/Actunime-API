# # Définit l'image de base
# FROM node:22-slim AS base
# ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"
# RUN corepack enable
# COPY . /app
# WORKDIR /app

# ENV NODE_ENV production

# # Installe les dépendances de production
# FROM base AS prod-deps
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# # Construit le projet
# FROM base AS build
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# RUN tsc --noEmit --noEmitOnError

# # Crée l'image finale
# FROM base
# COPY --from=prod-deps /app/node_modules /app/node_modules
# COPY --from=build /app/build /app/build


# EXPOSE 3000

# CMD [ "pnpm", "run", "start" ]

FROM node:22 AS base

FROM base AS deps
 
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod
 
FROM base AS build
 
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
 
FROM base
 
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

EXPOSE 3000

ENV NODE_ENV production
CMD ["pnpm", "run", "start"]
FROM node:22.14-alpine AS base

# specify work dir
WORKDIR /usr/src/app

# copy only files required to install dependencies (better layer caching)
COPY package*.json ./

FROM base AS development

# install both regular and dev dependencies
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm install

COPY . .

CMD ["npm", "run", "dev"]

FROM base AS build

# install both regular and dev dependencies
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm install

COPY . .

# run the tsc
RUN npm run build

FROM base AS production

# set node_env
ENV NODE_ENV=production

# install only prod dependencies
# use cache mount to speed up install of existing dependencies
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci --only=production

# use non-root user 
# use --chown on copy cmds to set file permissions
USER node

# copy remaining source code after installing dependencies
COPY --from=build --chown=node:node /usr/src/app/dist ./

# indicate expected port
EXPOSE 3000

CMD ["node", "server.js"]
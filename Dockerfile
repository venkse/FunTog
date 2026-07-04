FROM node:22-alpine

WORKDIR /app

# Workspace manifests + sources. The repo intentionally has no build step:
# everything runs from TypeScript sources through tsx.
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
COPY apps ./apps

RUN npm install --no-audit --no-fund

ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA \
    NODE_ENV=production \
    PORT=3000

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["npm", "start", "--workspace", "@funtog/server"]

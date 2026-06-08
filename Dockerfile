ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder
ARG NOTION_PAGE_ID
ARG NOTION_ACCESS_TOKEN
ENV NOTION_PAGE_ID=$NOTION_PAGE_ID
ENV NOTION_ACCESS_TOKEN=$NOTION_ACCESS_TOKEN
RUN corepack enable
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm build

FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
RUN corepack enable
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000

CMD ["pnpm", "start"]

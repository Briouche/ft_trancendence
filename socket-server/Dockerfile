FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM base AS production
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 4000
CMD ["node", "index.js"]

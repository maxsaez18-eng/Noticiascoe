FROM node:20-slim

WORKDIR /srv

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
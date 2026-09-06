FROM node:20-slim

WORKDIR /srv

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV PORT=7860
EXPOSE 7860

CMD ["node", "server.js"]
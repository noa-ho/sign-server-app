FROM ghcr.io/puppeteer/puppeteer:22.1.0

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
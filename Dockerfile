FROM --platform=linux/arm64 node:latest AS node-arm64-build

FROM node-arm64-build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:dev" ]
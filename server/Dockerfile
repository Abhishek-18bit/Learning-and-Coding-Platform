FROM node:22-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache g++ make

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm install

RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]

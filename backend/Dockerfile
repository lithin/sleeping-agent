FROM node:18-alpine
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package*.json tsconfig.json ./
COPY prisma ./prisma
RUN npm install
COPY src ./src
RUN npm run prisma:generate
RUN npm run build
EXPOSE 4000
CMD ["sh", "-c", "npm run prisma:migrate && npm start"]

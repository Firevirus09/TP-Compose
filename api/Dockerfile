FROM node:22-alpine
WORKDIR /app

COPY --chmod=644 package*.json ./
RUN npm ci --omit=dev

COPY --chmod=644 server.js ./

USER node
EXPOSE 3000
CMD ["node", "server.js"]

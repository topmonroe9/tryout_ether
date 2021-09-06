FROM node:14 AS builder
WORKDIR /app
COPY ./package.json ./package-lock.json ./
RUN npm i
COPY . .
RUN npm run build

FROM node:14-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE ${PORT}
CMD ["npm", "run", "start:prod"]
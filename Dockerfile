FROM node:24-slim
WORKDIR /usr/src/app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

FROM node:18.13.0
WORKDIR /usr/src/app

COPY . .
RUN npm ci --omit=dev
RUN npm run build
EXPOSE 3000
CMD npm start


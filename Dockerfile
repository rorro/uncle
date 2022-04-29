FROM node:16.15.0 as base

WORKDIR /uncle

COPY ["package.json", "package-lock.json", "./"]

RUN rm -rf node_modules && npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]

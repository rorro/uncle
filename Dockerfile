FROM node:16.15.0 as base

ENV NODE_OPTIONS=--max_old_space_size=1024

WORKDIR /uncle

COPY ["package.json", "package-lock.json", "./"]

RUN rm -rf node_modules && npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]

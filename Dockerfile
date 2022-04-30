FROM node:17-alpine3.14
WORKDIR /app
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY tsconfig.json /app/tsconfig.json
RUN npm install
COPY . .

EXPOSE 3001

CMD ["npm", "run", "compile"]
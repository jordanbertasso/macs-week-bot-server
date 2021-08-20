FROM node

WORKDIR /app

COPY package.json ./

RUN npm i --only=production

COPY index.js .

COPY key-dates.js .

ENV TZ Australia/Sydney

CMD ["node", "index.js"]


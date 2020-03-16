FROM node:10.15-alpine as prod

ENV NODE_ENV=production

RUN apk update && \
    apk add --update \
    python \
    python-dev \
    py-pip \
    build-base \
    curl \
    tini \
    && pip install virtualenv \
    && rm -rf /var/cache/apk/*

EXPOSE 3000

WORKDIR /app

RUN mkdir app && mkdir dist && chown -R node:node .

USER node

COPY package.json package-lock*.json ./

RUN npm install && npm cache clean --force

COPY --chown=node:node . .

RUN chmod +x ./scripts/*.sh

ENTRYPOINT [ "/sbin/tini", "--" ]

CMD ["./scripts/start.sh"]

FROM prod as dev

ENV NODE_ENV=development

RUN npm install

CMD ["./scripts/start.sh"]

FROM prod as test

ENV NODE_ENV=test

CMD ["./scripts/start.sh"]
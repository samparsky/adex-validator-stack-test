FROM mhart/alpine-node:11

MAINTAINER samparsky@gmail.com

RUN echo 'http://dl-3.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories && \
    apk upgrade --update && \ 
    apk add mongodb 

WORKDIR /app 
# clone repo
RUN apk add --no-cache bash git openssh

RUN git clone https://github.com/AdExNetwork/adex-validator-stack-js

RUN mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config

RUN cd adex-validator-stack-js && \
    npm install && npm install -g pm2 && \
    mongo adexValidator test/prep-db/mongo.js

RUN pm2 start bin/validatorWorker.js -- --adapter=dummy --dummyIdentity=${IDENTITY} && \
    pm2 start bin/sentry.js --adapter=dummy --dummyIdentity=${IDENTITY}

EXPOSE ${PORT}
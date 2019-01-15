FROM mhart/alpine-node:11
# add the stack repo
# use forever to launch the 
# install mongo
MAINTAINER samparsky@gmail.com

RUN echo 'http://dl-3.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories && \
    apk upgrade --update && \ 
    apk add mongodb

WORKDIR /app 
# clone repo

RUN git clone https://github.com/AdExNetwork/adex-validator-stack-js

RUN cd adex-validator-stack-js && npm install && npm install -g pm2

RUN pm2 start bin/validatorWorker.js -- --adapter=dummy --dummyIdentity=${IDENTITY} && \
    pm2 start bin/sentry.js --adapter=dummy --dummyIdentity=${IDENTITY}

EXPOSE ${PORT}
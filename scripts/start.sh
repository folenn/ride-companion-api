#!/bin/sh

npm=$PWD/node_modules/.bin


echo "NODE_ENV: ${NODE_ENV}";

if [ "${NODE_ENV}" == 'production' ]; then
  ./node_modules/.bin/tsc;
  node ./dist/server.js;
elif [ "${NODE_ENV}" == 'test' ]; then
  ./node_modules/.bin/env-cmd -f test.env jest -i;
  echo 'test env';
else
    ./node_modules/.bin/nodemon ./src/server.ts --inspect=0.0.0.0:9229;
fi

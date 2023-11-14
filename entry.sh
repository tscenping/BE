#!/bin/bash

mkdir -p /app \
&& cd /app \
&& npm i \
&& npm run build

exec npm run start:dev
FROM --platform=linux/arm64 node:latest AS node-arm64-build

FROM node-arm64-build

COPY ./entry.sh /tmp/entry.sh
RUN chmod +x /tmp/entry.sh

ENTRYPOINT [ "/tmp/entry.sh" ]

WORKDIR /app
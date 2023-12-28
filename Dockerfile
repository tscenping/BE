FROM node:latest

RUN apt-get update && apt-get install -y libnss3-tools

COPY ./entry.sh /tmp/entry.sh
RUN chmod +x /tmp/entry.sh

ENTRYPOINT [ "/tmp/entry.sh" ]

WORKDIR /app
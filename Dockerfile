FROM node:16-alpine

MAINTAINER Daryl "daryl@ifixit.com"

WORKDIR /opt/blessyou
COPY . .

RUN npm install

CMD /opt/blessyou/bin/blessyou --port=7355 --host=0.0.0.0

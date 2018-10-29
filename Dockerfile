FROM alpine 

MAINTAINER Daryl "daryl@ifixit.com"

RUN apk update && apk upgrade && apk add nodejs

ADD . /opt/blessyou

CMD /opt/blessyou/bin/blessyou --port=7355 --host=0.0.0.0

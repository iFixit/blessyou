FROM fedora:latest

MAINTAINER Daryl "daryl@ifixit.com"

RUN dnf -y install git nodejs \
   && git clone https://github.com/iFixit/blessyou /opt/blessyou \
   && cd /opt/blessyou \
   && git fetch && git checkout master \
   && npm install

CMD /opt/blessyou/bin/blessyou --port=7355 --host=0.0.0.0

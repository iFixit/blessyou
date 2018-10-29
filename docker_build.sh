#!/bin/bash -ex

# Build the bless you Docker container

npm install

docker build -t blessyou .

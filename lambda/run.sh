#!/bin/bash

docker run --platform linux/amd64 -v ./images:/tmp/images -p 9000:8080 cyberbit/imgon:node-lambda
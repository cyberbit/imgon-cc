#!/bin/bash

# docker buildx build --progress=plain --no-cache --platform linux/amd64 --provenance=false -t cyberbit/imgon:node-lambda .
docker buildx build --platform linux/amd64 --provenance=false -t cyberbit/imgon:node-lambda .
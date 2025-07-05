#!/bin/bash

curl "http://host.docker.internal:9000/2015-03-31/functions/function/invocations" -d '{ "rawPath": "/128x128:Dordered/https://images.unsplash.com/photo-1726351543722-b35eca8f5e90", "rawQueryString": "q=80&w=512&format=jpg&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }'
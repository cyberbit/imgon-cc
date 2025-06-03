FROM public.ecr.aws/lambda/nodejs:22 AS builder

WORKDIR ${LAMBDA_TASK_ROOT}

# node-gyp prerequisites
RUN dnf install -y \
    gcc \
    g++ \
    make \
    python3

COPY package.json  ./
RUN npm install

# COPY index.ts ./
# RUN npm run build

COPY index.js ./
    
# FROM public.ecr.aws/lambda/nodejs:22

# WORKDIR ${LAMBDA_TASK_ROOT}

# RUN ls -al /usr/app/dist

# RUN cp /usr/app/dist/* ./
COPY images ./images

CMD ["index.handler"]
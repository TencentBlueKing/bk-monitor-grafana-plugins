ARG NODE_IMAGE=node:20
ARG PNPM_VERSION=10.26.2
ARG NODE_PLATFORM=linux/amd64

FROM --platform=${NODE_PLATFORM} ${NODE_IMAGE} as nodejs

WORKDIR /code

RUN npm i -g pnpm@${PNPM_VERSION}

COPY . .

RUN pnpm i \
&& pnpm run build \
&& rm -rf build \
&& mkdir -p build/alert \
&& mkdir -p build/event \
&& mkdir -p build/timeseries \
&& mkdir -p build/trace \
&& mkdir -p build/profiling \
&& mv src/alert/dist/* build/alert \
&& mv src/event/dist/* build/event \
&& mv src/timeseries/dist/* build/timeseries \
&& mv src/trace/dist/* build/trace \
&& mv src/profiling/dist/* build/profiling

RUN tar -czvf frontend.tar.gz  build

CMD [ "echo", "前端构建完毕" ]

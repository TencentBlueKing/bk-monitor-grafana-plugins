#!/bin/bash -e

# 默认为./build
target=${1:-./build}

rm -rf ./build

docker build -t bkmonitor_plugin_build .

docker run -d --name plugin-temp-container bkmonitor_plugin_build

mkdir -p "$target"

docker cp plugin-temp-container:/code/frontend.tar.gz "$target"

docker rm plugin-temp-container


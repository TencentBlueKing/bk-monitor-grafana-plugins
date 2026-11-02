#!/bin/bash -e

set -e

# 默认为./build
target=${1:-./build}

rm -rf ./build

docker build -t bkmonitor_plugin_build .

container_id=
cleanup() {
    cleanup_exit_code=$?
    if [ -n "$container_id" ]; then
        docker rm "$container_id" || true
    fi
    exit "$cleanup_exit_code"
}
trap cleanup EXIT

container_id=$(docker create bkmonitor_plugin_build)

mkdir -p "$target"

docker cp "$container_id:/code/frontend.tar.gz" "$target"

docker rm "$container_id"
container_id=


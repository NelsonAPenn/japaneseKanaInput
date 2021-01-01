#!/bin/bash
./build.sh

cd build
web-ext sign --api-key $WEB_EXT_API_KEY --api-secret $WEB_EXT_API_SECRET

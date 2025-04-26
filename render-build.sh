#!/usr/bin/env bash
set -o errexit

# Force npm instead of bun
cd client
npm install
npm run build
cd ../server
npm install
npm run build
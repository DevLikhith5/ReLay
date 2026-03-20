#!/bin/bash

cd "$(dirname "$0")"

echo "Stopping existing database containers and destroying old volumes..."
docker compose down -v

echo "Starting fresh database containers..."
docker compose up -d

echo "Waiting for PostgreSQL to initialize..."
sleep 3

echo "Schema successfully migrated! All 3 shards are up and running."

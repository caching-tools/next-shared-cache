#!/bin/bash

# Set common paths
STANDALONE_DIR="$PWD/.next/standalone"
APP_DIR="$STANDALONE_DIR/apps/cache-testing-15-app"
PUBLIC_DIR="$PWD/public"
STATIC_DIR="$PWD/.next/static"
FETCH_CACHE_DIR="$PWD/.next/cache/fetch-cache"
INSTANCES_DIR="$PWD/.next/__instances"

copy_dir() {
    if ! cp -r "$1" "$2"; then
        echo "Failed to copy from $1 to $2"
        exit 1
    fi
}

# Copy public directory to standalone app directory
copy_dir "$PUBLIC_DIR/" "$APP_DIR/public"

# Copy static directory to standalone app/.next directory
copy_dir "$STATIC_DIR/" "$APP_DIR/.next/static"

# Copy fetch cache directory to standalone app/.next directory
mkdir -p "$APP_DIR/.next/cache/fetch-cache/"
cp $FETCH_CACHE_DIR/* $APP_DIR/.next/cache/fetch-cache/

create_instance_dir() {
    if ! mkdir -p "$INSTANCES_DIR/$1"; then
        echo "Failed to create $INSTANCES_DIR/$1 directory"
        exit 1
    fi
}

# Create instance directories
create_instance_dir 3000
create_instance_dir 3001

# Copy files from standalone directory to instance directories
copy_dir "$STANDALONE_DIR/." "$INSTANCES_DIR/3000"
copy_dir "$STANDALONE_DIR/." "$INSTANCES_DIR/3001"

#!/bin/bash

# Set common paths
STANDALONE_DIR="$PWD/.next/standalone"
PUBLIC_DIR="$PWD/public"
APP_DIR="$STANDALONE_DIR/apps/cache-testing"
STATIC_DIR="$PWD/.next/static"
INSTANCES_DIR="$PWD/.next/__instances"

# Remove existing $INSTANCES_DIR directory
if ! rm -rf $INSTANCES_DIR; then
    echo "Failed to remove existing $INSTANCES_DIR directory"
    exit 1
fi

# Create $INSTANCES_DIR directory
if ! mkdir -p $INSTANCES_DIR/3000; then
    echo "Failed to create $INSTANCES_DIR/3000 directory"
    exit 1
fi

# Create $INSTANCES_DIR directory
if ! mkdir -p $INSTANCES_DIR/3001; then
    echo "Failed to create $INSTANCES_DIR/3001 directory"
    exit 1
fi

# Copy files from $STANDALONE_DIR to $INSTANCES_DIR/3000
if ! cp -r $STANDALONE_DIR/. $INSTANCES_DIR/3000/; then
    echo "Failed to copy standalone directory"
    exit 1
fi

# Copy $PUBLIC_DIR to $INSTANCES_DIR/3000/public
if ! cp -r $PUBLIC_DIR/ $INSTANCES_DIR/3000/public/; then
    echo "Failed to copy public directory"
    exit 1
fi

# Copy files from $APP_DIR to $INSTANCES_DIR/3000
if ! cp -r $STANDALONE_DIR/apps/cache-testing/. $INSTANCES_DIR/3000/; then
    echo "Failed to copy app directory"
    exit 1
fi

# Copy $STATIC_DIR to $INSTANCES_DIR/3000/.next/static
if ! cp -r $STATIC_DIR/ $INSTANCES_DIR/3000/.next/static/; then
    echo "Failed to copy static directory"
    exit 1
fi

# Copy files from $INSTANCES_DIR/3000 to $INSTANCES_DIR/3001
if ! cp -r $INSTANCES_DIR/3000/. $INSTANCES_DIR/3001/.; then
    echo "Failed to copy $INSTANCES_DIR from 3000 to 3001"
    exit 1
fi

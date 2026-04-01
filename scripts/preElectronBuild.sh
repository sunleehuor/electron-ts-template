#!/bin/bash

SRC="./electron/src/screens"
DEST="./dist/electron/src/screens"

# create dest if not exists
mkdir -p "$DEST"

# copy
cp -r "$SRC/." "$DEST"

echo "✅ Copied $SRC → $DEST"
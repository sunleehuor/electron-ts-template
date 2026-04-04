#!/bin/bash

SRC_DIR="./dist/renderer"
OUT_NAME="platform"
ZIP_NAME="update.zip"
UPDATE_NAME="updates.json"

# ===== Validate version =====
while true; do
  read -p "Enter version (x.x.x): " version

  if [[ -z "$version" ]]; then
    echo "❌ Version is required"
  elif [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    break
  else
    echo "❌ Invalid format. Use x.x.x (e.g. 1.0.0)"
  fi
done

# ===== Validate name =====
while true; do
  read -p "Enter name: " name

  if [[ -n "$name" ]]; then
    break
  else
    echo "❌ Name is required"
  fi
done

# Create output directory if it doesn't exist
mkdir -p "./dist/$OUT_NAME"

# ===== Create JSON =====
cat <<EOF > "./dist/$OUT_NAME/$UPDATE_NAME"
{
  "version": "$version",
  "name": "$name"
}
EOF

echo "✅ JSON file created: $UPDATE_NAME"

# Ensure source exists
if [ ! -d "$SRC_DIR" ]; then
  echo "Source directory not found: $SRC_DIR"
  exit 1
fi

# Zip contents
(cd "$SRC_DIR" && zip -r "../$OUT_NAME/$ZIP_NAME" .)


echo "Zip created at $ZIP_FILE"
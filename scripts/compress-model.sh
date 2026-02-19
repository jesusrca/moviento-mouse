#!/usr/bin/env bash
set -euo pipefail

INPUT_PATH="${1:-public/model.glb}"
OUTPUT_PATH="${2:-public/model-compressed.glb}"

if [ ! -f "$INPUT_PATH" ]; then
  echo "No existe el archivo de entrada: $INPUT_PATH"
  exit 1
fi

echo "Comprimiendo $INPUT_PATH -> $OUTPUT_PATH"
npx -y @gltf-transform/cli optimize \
  "$INPUT_PATH" \
  "$OUTPUT_PATH" \
  --compress draco \
  --texture-compress webp \
  --texture-size 1024

echo "Listo:"
ls -lh "$INPUT_PATH" "$OUTPUT_PATH"

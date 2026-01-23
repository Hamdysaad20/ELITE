#!/bin/bash
# run_generation.sh

# Helper script to run the image generation
# Usage: ./run_generation.sh [slug]

SLUG=$1

if [ -z "$SLUG" ]; then
  echo "Usage: ./run_generation.sh <product-slug>"
  echo "Example: ./run_generation.sh vanilla-shake"
  exit 1
fi

echo "🚀 Starting Image Generation for: $SLUG"
echo "Note: Ensure you have AZURE_FLUX_ENDPOINT + AZURE_FLUX_KEY in .env.local (default engine: flux)."
echo "      Optional: pass --engine=openai to use DALL·E instead."
echo "      Default output has NO logo/text baked in. Pass --with-logo only if you want compositor+logo validation."

# Check if node exists
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js."
    exit 1
fi

# Run the script
npx ts-node scripts/image-generation/generate.ts --slug="$SLUG" --live "${@:2}"

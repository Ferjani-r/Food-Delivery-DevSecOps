#!/bin/bash

IMAGE=$1
THRESHOLD=0

echo "🔍 Scanning image: $IMAGE"

CRITICAL=$(trivy image \
  --severity CRITICAL \
  --format json \
  $IMAGE | jq '.Results[].Vulnerabilities | length')

if [ "$CRITICAL" -gt "$THRESHOLD" ]; then
  echo "❌ Found $CRITICAL critical vulnerabilities!"
  trivy image --severity CRITICAL $IMAGE
  exit 1
else
  echo "✅ Image scan passed!"
fi

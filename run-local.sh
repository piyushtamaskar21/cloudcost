#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/cloud-stack-estimator"
python3 -m http.server 8080

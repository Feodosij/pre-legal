#!/usr/bin/env bash
set -euo pipefail

docker rm -f prelegal >/dev/null 2>&1 && echo "Prelegal stopped." || echo "Prelegal is not running."

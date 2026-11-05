#!/bin/sh
# 점검 → 미리보기 → 앱 빌드 한 번에:  sh tools/all.sh
cd "$(dirname "$0")/.." && node tools/check_bank.js && node tools/preview.js && node tools/build.js

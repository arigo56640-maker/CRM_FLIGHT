#!/bin/sh
# Inject BACKEND_URL env var into config.js at startup
sed -i "s|window.BACKEND_URL = '';|window.BACKEND_URL = '${BACKEND_URL}';|" js/config.js
exec python3 -m http.server "${PORT:-8080}"

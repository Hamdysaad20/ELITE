#!/usr/bin/env bash
set -euo pipefail

# Remove unused auth0 helper and deprecated stubs
rm -f src/server/auth/auth0.ts
rm -f src/app/api/auth/login/route.ts
rm -f src/app/api/auth/verify/route.ts
rm -f src/server/auth/auth0.ts
rm -f src/app/api/auth/login/route.ts
rm -f src/app/api/auth/verify/route.ts

echo "Removed unused Auth0 and old auth stubs."


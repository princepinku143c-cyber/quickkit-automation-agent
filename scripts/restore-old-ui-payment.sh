#!/usr/bin/env bash
set -euo pipefail

# Restore known-stable UI/payment files from commit d01557a.
# Usage:
#   bash scripts/restore-old-ui-payment.sh
#   RESTORE_COMMIT=<commit> bash scripts/restore-old-ui-payment.sh

RESTORE_COMMIT="${RESTORE_COMMIT:-d01557a}"

FILES=(
  "App.tsx"
  "components/Sidebar.tsx"
  "api/billing/paypal/createOrder.ts"
  "api/billing/paypal/webhook.ts"
  "api/paypal/createOrder.ts"
  "api/paypal/webhook.ts"
)

echo "Restoring files from commit ${RESTORE_COMMIT} ..."
git checkout "${RESTORE_COMMIT}" -- "${FILES[@]}"

echo "Done. Restored files:"
printf ' - %s\n' "${FILES[@]}"

echo
echo "Next steps:"
echo "  1) npm run -s build"
echo "  2) npx tsc --noEmit"
echo "  3) git diff -- ${FILES[*]}"

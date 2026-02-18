# Connector Prioritization (S4)

This priority list is based on expected workflow impact, failure blast-radius, and payment/lead-gen criticality.

## Tier P0 (harden first)
1. **HTTP_REQUEST**
   - Base for custom integrations; failure affects most workflows.
2. **API_POLLER**
   - Trigger reliability is critical for data freshness and dedupe.
3. **STRIPE / RAZORPAY**
   - Revenue-impacting connectors; strict validation + retries required.
4. **EMAIL / GMAIL / MAILGUN**
   - High-usage outbound notifications and lead flows.
5. **SLACK / DISCORD / TELEGRAM**
   - Operational alerting and workflow notifications.

## Tier P1 (harden next)
6. **GOOGLE_DRIVE / DRIVE_UPLOAD / AWS_S3**
   - Common storage automation paths.
7. **POSTGRES / MYSQL / SUPABASE**
   - Core app and analytics data movement.
8. **GITHUB / GITLAB / JIRA**
   - Engineering ops automations.

## Tier P2 (harden after P0/P1)
9. **NOTION / AIRTABLE / HUBSPOT / SALESFORCE / ZENDESK**
10. **SHOPIFY / FTP / SSH / DOCKER / OUTLOOK / IMAP**

## Minimum hardening checklist per connector
- Required config validation (block run if missing).
- Retry policy defaults (`once` baseline).
- Actionable failure message with exact missing field.
- Sample known-good config in node docs.

## Current status
- Validation and retry defaults are implemented at framework level.
- Remaining connector-specific work should follow P0 -> P1 -> P2 order.
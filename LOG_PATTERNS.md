# Log Pattern Guide

## Payment webhook log patterns
All webhook logs use prefix: `[PAYPAL_WEBHOOK]`

### Expected patterns
- `Event=<type> EventId=<id> ResourceId=<id>`
- `Upgrade success User=<uid> Event=<type> PaymentId=<id>`
- `Duplicate skipped EventId=<id> PaymentId=<id>`

### Warning/error patterns
- `Missing uid/custom_id ...` -> event cannot map user.
- `Invalid webhook signature.` -> signature verification failed.
- `Handler error:` -> unhandled runtime or external API issue.

## Runtime hints
- `Run already in progress...` -> duplicate trigger prevented.
- `Run blocked...` / `Cloud run blocked...` -> workflow validation failure.
- `Cloud Timeout.` -> worker did not complete in timeout window.

## Operator action mapping
- Duplicate logs + 200 responses -> no action needed.
- Signature errors -> verify PayPal webhook config and env mode.
- Timeout patterns -> inspect worker processing and cloud queue.
# External integrations

No external service is assumed to be connected. The UI derives connection state from environment variables at runtime; secrets are never displayed. Status and setup screens are available at `/status`, `/admin/integrations` and `/super-admin/integrations`.

| Integration | Environment variables | Behavior when absent |
| --- | --- | --- |
| OpenRouter AI | `OPENROUTER_API_KEY`, optional `OPENROUTER_MODEL` | AI surfaces explain that configuration is required; no model calls are made |
| Password reset / email webhook | `PASSWORD_RESET_WEBHOOK_URL`, optional `PASSWORD_RESET_WEBHOOK_TOKEN` | Password reset requests report that delivery is unavailable; in development the reset link is logged |
| Payment gateway | `PAYMENT_WEBHOOK_SECRET` and provider credentials | Payment collection is not presented as connected |
| WhatsApp | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_ID` | WhatsApp delivery is shown as not configured |
| RMM / remote desktop | `RMM_API_URL`, `RMM_API_TOKEN` | No remote session is offered. Customer consent remains mandatory even when configured |
| Monitoring | `MONITORING_WEBHOOK_URL` | Public status page reports configuration state only, not live uptime |
| SMS | `SMS_API_KEY` | SMS notifications are shown as not configured |
| Avatar uploads | `UPLOADTHING_TOKEN` | Upload controls are hidden from the profile page and file storage is reported as not configured |

## Webhook contract

The password reset webhook receives a JSON POST body:

```json
{
  "to": "user@example.com",
  "name": "User name",
  "resetUrl": "https://.../auth/reset-password?token=...",
  "token": "..."
}
```

When `PASSWORD_RESET_WEBHOOK_TOKEN` is set, send it as a bearer token.

## Adding an integration

1. Add the environment variables to `.env.example` with empty values.
2. Add the boolean check in `lib/integrations.ts`.
3. Add setup instructions to both `i18n/en.json` and `i18n/ar.json`.
4. Implement the server-side call only; never expose provider secrets to the browser.
5. Update the status screens and this document.

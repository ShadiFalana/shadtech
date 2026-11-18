export type IntegrationKey =
  | "openRouter"
  | "email"
  | "payments"
  | "whatsapp"
  | "rmm"
  | "monitoring"
  | "sms"
  | "fileStorage";

const configured: Record<IntegrationKey, boolean> = {
  openRouter: Boolean(process.env.OPENROUTER_API_KEY),
  email: Boolean(process.env.PASSWORD_RESET_WEBHOOK_URL),
  payments: Boolean(process.env.PAYMENT_WEBHOOK_SECRET),
  whatsapp: Boolean(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_ID),
  rmm: Boolean(process.env.RMM_API_URL && process.env.RMM_API_TOKEN),
  monitoring: Boolean(process.env.MONITORING_WEBHOOK_URL),
  sms: Boolean(process.env.SMS_API_KEY),
  fileStorage: Boolean(process.env.UPLOADTHING_TOKEN),
};

export const setupKeyByIntegration: Record<IntegrationKey, string> = {
  openRouter: "integrations.setupOpenRouter",
  email: "integrations.setupEmail",
  payments: "integrations.setupPayments",
  whatsapp: "integrations.setupWhatsapp",
  rmm: "integrations.setupRmm",
  monitoring: "integrations.setupMonitoring",
  sms: "integrations.setupSms",
  fileStorage: "integrations.setupFileStorage",
};

export function integrationIsConfigured(key: IntegrationKey) {
  return configured[key];
}

export function configuredIntegrationCount() {
  return Object.values(configured).filter(Boolean).length;
}

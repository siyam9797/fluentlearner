export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  notificationWebhookUrl: process.env.NOTIFICATION_WEBHOOK_URL ?? "",
  uploadDir: process.env.UPLOAD_DIR ?? "client/public/uploads",
  publicUploadUrl: process.env.PUBLIC_UPLOAD_URL ?? "/uploads",
};

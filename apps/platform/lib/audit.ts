import { prisma } from "@/lib/db";

type AuditInput = {
  actorId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
};

/** Minimal delegate shape so callers can pass either `prisma` or a transaction client. */
type AuditWriter = Pick<typeof prisma, "auditLog">;

/** Write a single audit record. Returns the Prisma promise so it can be used in `$transaction([...])`. */
export function writeAudit(data: AuditInput, writer: AuditWriter = prisma) {
  return writer.auditLog.create({
    data: {
      actorId: data.actorId ?? null,
      action: data.action,
      entity: data.entity ?? null,
      entityId: data.entityId ?? null,
      details: data.details ?? null,
      ipAddress: data.ipAddress ?? null,
    },
  });
}

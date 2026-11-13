import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_METADATA = 'shadtech:permissions';

/**
 * Declares the permissions required by a handler. The tenant owner (`*`)
 * always passes; every listed permission must be granted otherwise.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_METADATA, permissions);

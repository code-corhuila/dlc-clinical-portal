/** Clinical narrative display gate (PAT-003). UI is never authorization. */

export type ClinicalRole = 'ADMINISTRATOR' | 'DENTIST' | 'SECRETARY_ASSISTANT';

export type ClinicalAccessDecision = 'granted' | 'denied';

export function resolveClinicalAccess(
  role: ClinicalRole | null,
  clinicalReadAuthorized: boolean,
): ClinicalAccessDecision {
  const authorizedRole = role === 'DENTIST' || role === 'ADMINISTRATOR';

  return authorizedRole && clinicalReadAuthorized ? 'granted' : 'denied';
}

export interface ClinicalGrants {
  readonly read: boolean;
  readonly write: boolean;
}

/**
 * Display grants from the Auth session, mirroring the Clinical API: a Dentist
 * by role (the API checks the assignment), an Administrator only with the
 * configured clinical permissions, the Assistant never (PAT-003).
 */
export function clinicalGrants(
  role: ClinicalRole | null | undefined,
  permissions: readonly string[],
  names: { readonly read: string; readonly write: string },
): ClinicalGrants {
  if (role === 'DENTIST') return { read: true, write: true };
  if (role === 'ADMINISTRATOR')
    return {
      read: permissions.includes(names.read),
      write: permissions.includes(names.write),
    };
  return { read: false, write: false };
}

/** Write permission is separate from clinical read permission. */
export function resolveClinicalWriteAccess(
  role: ClinicalRole | null,
  clinicalWriteAuthorized?: boolean,
): ClinicalAccessDecision {
  const authorizedRole = role === 'DENTIST' || role === 'ADMINISTRATOR';

  return authorizedRole && clinicalWriteAuthorized === true
    ? 'granted'
    : 'denied';
}

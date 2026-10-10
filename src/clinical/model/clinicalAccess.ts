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

import {
  resolveClinicalAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';

/** Billing `Price` fields read by Clinical (`GET /procedure-prices`). */
export interface ProcedurePrice {
  readonly procedureCode: string;
  readonly name: string;
  readonly basePrice: string;
  readonly currency: 'COP';
  readonly status: 'ACTIVE' | 'INACTIVE';
}

/** Host-provided boundary for the Billing price catalog; no HTTP details. */
export interface ProcedurePricePort {
  listProcedurePrices(): Promise<readonly ProcedurePrice[]>;
}

export type PriceEstimate = Readonly<
  Record<string, { readonly name: string; readonly basePrice: string }>
>;

/**
 * Read-only Billing estimate for the clinical plan (wireframe page 29).
 * Clinical never stores, edits or sends these amounts (CLN-006).
 */
export class BillingEstimate {
  constructor(private readonly port: ProcedurePricePort) {}

  async read(access: {
    readonly role: ClinicalRole | null;
    readonly clinicalReadAuthorized: boolean;
  }): Promise<PriceEstimate> {
    if (
      resolveClinicalAccess(access.role, access.clinicalReadAuthorized) !==
      'granted'
    )
      throw { code: 'FORBIDDEN' };
    const prices = await this.port.listProcedurePrices();
    return Object.fromEntries(
      prices
        .filter((price) => price.status === 'ACTIVE')
        .map((price) => [
          price.procedureCode,
          { name: price.name, basePrice: price.basePrice },
        ]),
    );
  }
}

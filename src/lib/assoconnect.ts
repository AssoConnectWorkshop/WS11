import "server-only";

const BASE_URL = "https://app.assoconnect.com/api/v1";

export type Organization = {
  "@id": string;
  "@type": string;
  brand: string;
  isAdvanced: boolean;
  isLegalIndependent: boolean;
  logoUrl: string;
  name: string;
  parent: string | null;
  phoneNumber: string;
  url: string;
};

type AnyRecord = Record<string, unknown>;

type CollectionResponse<T> = {
  "hydra:member": T[];
  "hydra:totalItems": number;
};

async function request<T>(path: string): Promise<T> {
  const token = process.env.ASSOCONNECT_API_KEY;
  if (!token) throw new Error("ASSOCONNECT_API_KEY is not set");

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: "application/ld+json",
      "X-AUTH-TOKEN": token,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`AssoConnect ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

function orgUlid() {
  const ulid = process.env.ASSOCONNECT_ORGANIZATION_ULID;
  if (!ulid) throw new Error("ASSOCONNECT_ORGANIZATION_ULID is not set");
  return ulid;
}

function buildQs(params: Record<string, string | number | boolean | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  return qs.toString();
}

// ─── Organization ────────────────────────────────────────────────────────────

export function getOrganization(ulid = process.env.ASSOCONNECT_ORGANIZATION_ULID) {
  if (!ulid) throw new Error("ASSOCONNECT_ORGANIZATION_ULID is not set");
  return request<Organization>(`/organizations/${ulid}`);
}

export async function getNonprofit() {
  return request<AnyRecord>(`/organizations/${orgUlid()}/nonprofit`);
}

// ─── CRM ─────────────────────────────────────────────────────────────────────

export type StatsCrm = {
  "@id": string;
  "@type": string;
  totalContacts: number;
  totalPersons: number;
  totalOrganizations: number;
  totalMembers: number;
  totalActiveMembers: number;
  [key: string]: unknown;
};

export type Contact = {
  "@id": string;
  "@type": string;
  type: string;
  email?: string;
  [key: string]: unknown;
};

export function getStatsCrm(ulid = process.env.ASSOCONNECT_ORGANIZATION_ULID) {
  if (!ulid) throw new Error("ASSOCONNECT_ORGANIZATION_ULID is not set");
  return request<StatsCrm>(`/organizations/${ulid}/stats_crm`);
}

export async function getContactsSummary(ulid = process.env.ASSOCONNECT_ORGANIZATION_ULID) {
  if (!ulid) throw new Error("ASSOCONNECT_ORGANIZATION_ULID is not set");
  const data = await request<CollectionResponse<Contact>>(
    `/organizations/${ulid}/contacts?itemsPerPage=1&pagination=true`
  );
  return { total: data["hydra:totalItems"] };
}

export function listContacts(params: { page?: number; itemsPerPage?: number; type?: string } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<Contact>>(`/organizations/${orgUlid()}/contacts?${qs}`);
}

export function getContact(id: string) {
  return request<AnyRecord>(`/crm/contacts/${id}`);
}

export function getPerson(id: string) {
  return request<AnyRecord>(`/crm/people/${id}`);
}

export function getPersonAddress(id: string) {
  return request<AnyRecord>(`/crm/people/${id}/address`);
}

export function listGroups(params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/groups?${qs}`);
}

// ─── Payments ────────────────────────────────────────────────────────────────

export function listInvoices(params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/invoices?${qs}`);
}

export function getInvoice(id: string) {
  return request<AnyRecord>(`/invoices/${id}`);
}

export function listPaymentRequests(params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/payment_requests?${qs}`);
}

export function getPaymentSettings() {
  return request<AnyRecord>(`/organizations/${orgUlid()}/payment_settings`);
}

export async function listTaxReceipts(params: { page?: number; itemsPerPage?: number } = {}) {
  const nonprofit = await getNonprofit();
  const nonprofitId = (nonprofit["@id"] as string).split("/").pop();
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/nonprofits/${nonprofitId}/tax_receipts?${qs}`);
}

// ─── Accounting ───────────────────────────────────────────────────────────────

export function listAccountingEntries(params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/accounting_entries?${qs}`);
}

export async function listAccountingYears() {
  const nonprofit = await getNonprofit();
  const nonprofitId = (nonprofit["@id"] as string).split("/").pop();
  return request<CollectionResponse<AnyRecord>>(`/nonprofits/${nonprofitId}/accounting_years`);
}

export async function listAccountingBudgets() {
  const nonprofit = await getNonprofit();
  const nonprofitId = (nonprofit["@id"] as string).split("/").pop();
  return request<CollectionResponse<AnyRecord>>(`/nonprofits/${nonprofitId}/accounting_budgets`);
}

export function getGeneralLedgerTotals() {
  return request<AnyRecord>(`/organizations/${orgUlid()}/accounting/documents/general_ledger/totals`);
}

export function listExpenseReports(params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/finance_expense_reports?${qs}`);
}

// ─── Banking ─────────────────────────────────────────────────────────────────

export function listBankAccounts() {
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/bank_accounts`);
}

export function listBankEntries(bankAccountId: string, params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/bank_accounts/${bankAccountId}/bank_entries?${qs}`);
}

export function getBankEntriesBalance(bankAccountId: string) {
  return request<AnyRecord>(`/bank_accounts/${bankAccountId}/bank_entries_balance`);
}

export function listPspSubWallets() {
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/psp_sub_wallets`);
}

export function getPspSubWalletBalance(pspSubWalletId: string) {
  return request<AnyRecord>(`/psp_sub_wallets/${pspSubWalletId}/balances`);
}

// ─── Website / Collects ───────────────────────────────────────────────────────

export function listCollects(params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/collects?${qs}`);
}

export function getCollect(id: string) {
  return request<AnyRecord>(`/collects/${id}`);
}

export function listAnalyticsPages() {
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/analytics_pages`);
}

// ─── Emailing ────────────────────────────────────────────────────────────────

export function listEmailCampaigns(params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/organizations/${orgUlid()}/communication/email_campaigns?${qs}`);
}

export function getEmailCampaign(id: string) {
  return request<AnyRecord>(`/communication/email_campaigns/${id}`);
}

export function listEmailCampaignMessages(campaignId: string, params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/communication/email_campaigns/${campaignId}/messages?${qs}`);
}

export function listEmailCampaignBlockedMessages(campaignId: string, params: { page?: number; itemsPerPage?: number } = {}) {
  const qs = buildQs({ ...params, pagination: true });
  return request<CollectionResponse<AnyRecord>>(`/communication/email_campaigns/${campaignId}/blocked_messages?${qs}`);
}

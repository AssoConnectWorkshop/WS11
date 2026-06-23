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

export function getOrganization(ulid = process.env.ASSOCONNECT_ORGANIZATION_ULID) {
  if (!ulid) throw new Error("ASSOCONNECT_ORGANIZATION_ULID is not set");
  return request<Organization>(`/organizations/${ulid}`);
}

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

type CollectionResponse<T> = {
  "hydra:member": T[];
  "hydra:totalItems": number;
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

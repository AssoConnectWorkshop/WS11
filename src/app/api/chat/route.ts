import Anthropic from "@anthropic-ai/sdk";
import {
  getStatsCrm, getContactsSummary, getOrganization,
  listContacts, getContact, getPerson, getPersonAddress, listGroups,
  listInvoices, getInvoice, listPaymentRequests, getPaymentSettings, listTaxReceipts,
  listAccountingEntries, listAccountingYears, listAccountingBudgets, getGeneralLedgerTotals, listExpenseReports,
  listBankAccounts, listBankEntries, getBankEntriesBalance, listPspSubWallets, getPspSubWalletBalance,
  listCollects, getCollect, listAnalyticsPages,
  listEmailCampaigns, getEmailCampaign, listEmailCampaignMessages, listEmailCampaignBlockedMessages,
} from "@/lib/assoconnect";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an analytics assistant embedded in AssoConnect, a SaaS platform for nonprofit associations.
Your job: turn association data into clear, actionable insight for non-technical admins.

You have tools to fetch live data across all AssoConnect modules: CRM, Payments, Accounting, Banking, Website/Forms, and Emailing.
Always use your tools to fetch real data when the user asks — never say you don't have access.

Workflow:
1. When asked about data, call the relevant tool(s) first, then answer based on what you get back.
2. If you need related data (e.g. bank account ID before fetching entries), chain tool calls.
3. Lead with the most important insight, then supporting details.
4. Suggest 1-2 next actions when relevant.

Report rules:
- Plain language, no jargon.
- Format numbers clearly (e.g. "1 234" not "1234").
- Use bullet points for lists, bold for key figures.
- Never make up data.

Design guidelines:
- Warm and helpful, not robotic.
- Address the admin as "you".
- Use the association's name when you have it.`;

type Prop = { type: string; description: string };
function tool(name: string, description: string, properties: Record<string, Prop> = {}, required: string[] = []): Anthropic.Tool {
  return {
    name,
    description,
    input_schema: { type: "object" as const, properties, required },
  };
}

const PAGE_PROPS: Record<string, Prop> = {
  page: { type: "number", description: "Page number (default 1)" },
  itemsPerPage: { type: "number", description: "Items per page (default 10, max 100)" },
};

const ID_PROP: Record<string, Prop> = {
  id: { type: "string", description: "Resource ULID identifier" },
};

const tools: Anthropic.Tool[] = [
  // CRM
  tool("get_stats_crm", "Get CRM summary: total contacts, persons, org-contacts, members, active members."),
  tool("list_contacts", "List contacts from the CRM. Returns IDs, types, emails.", { ...PAGE_PROPS, type: { type: "string", description: "Filter by type: 'person' or 'organization'" } }),
  tool("get_contact", "Get full details for one contact.", ID_PROP, ["id"]),
  tool("get_person", "Get personal details (name, DOB) for a person.", ID_PROP, ["id"]),
  tool("get_person_address", "Get the postal address of a person.", ID_PROP, ["id"]),
  tool("list_groups", "List sub-groups / sections of the organization.", PAGE_PROPS),

  // Payments
  tool("list_invoices", "List all invoices for the organization.", PAGE_PROPS),
  tool("get_invoice", "Get details of a single invoice.", ID_PROP, ["id"]),
  tool("list_payment_requests", "List payment requests (pending / completed).", PAGE_PROPS),
  tool("get_payment_settings", "Get the organization's payment configuration."),
  tool("list_tax_receipts", "List tax receipts issued by the association.", PAGE_PROPS),

  // Accounting
  tool("list_accounting_entries", "List accounting entries (transactions) for the organization.", PAGE_PROPS),
  tool("list_accounting_years", "List fiscal years with their status (open/closed)."),
  tool("list_accounting_budgets", "List accounting budgets."),
  tool("get_general_ledger_totals", "Get general ledger totals (aggregated balances per account)."),
  tool("list_expense_reports", "List expense reports submitted in the organization.", PAGE_PROPS),

  // Banking
  tool("list_bank_accounts", "List bank accounts linked to the organization."),
  tool("list_bank_entries", "List bank transactions for a specific bank account.", { id: { type: "string", description: "Bank account ULID" }, ...PAGE_PROPS }, ["id"]),
  tool("get_bank_entries_balance", "Get the current balance of a bank account.", { id: { type: "string", description: "Bank account ULID" } }, ["id"]),
  tool("list_psp_sub_wallets", "List PSP (payment processor) sub-wallets for the organization."),
  tool("get_psp_sub_wallet_balance", "Get the balance of a PSP sub-wallet.", { id: { type: "string", description: "PSP sub-wallet ULID" } }, ["id"]),

  // Website / Collects
  tool("list_collects", "List online forms (membership, donation, event, product collects).", PAGE_PROPS),
  tool("get_collect", "Get details of a specific collect/form.", ID_PROP, ["id"]),
  tool("list_analytics_pages", "List website page analytics for the organization."),

  // Emailing
  tool("list_email_campaigns", "List email campaigns.", PAGE_PROPS),
  tool("get_email_campaign", "Get details and stats for a single email campaign.", ID_PROP, ["id"]),
  tool("list_email_campaign_messages", "List individual messages sent within a campaign.", { id: { type: "string", description: "Campaign ULID" }, ...PAGE_PROPS }, ["id"]),
  tool("list_email_campaign_blocked_messages", "List bounced or blocked messages for a campaign.", { id: { type: "string", description: "Campaign ULID" }, ...PAGE_PROPS }, ["id"]),
];

type ToolInput = Record<string, unknown>;

function extractId(iriOrId: string) {
  return (iriOrId ?? "").split("/").pop() ?? iriOrId;
}

async function runTool(name: string, input: ToolInput): Promise<string> {
  try {
    const p = (key: string) => input[key] as number | undefined;
    const pagination = (extra?: Record<string, unknown>) => ({
      page: p("page"),
      itemsPerPage: p("itemsPerPage") ?? 10,
      ...extra,
    });

    switch (name) {
      // CRM
      case "get_stats_crm": return JSON.stringify(await getStatsCrm());
      case "list_contacts": return JSON.stringify(await listContacts({ ...pagination(), type: input.type as string | undefined }));
      case "get_contact": return JSON.stringify(await getContact(extractId(input.id as string)));
      case "get_person": return JSON.stringify(await getPerson(extractId(input.id as string)));
      case "get_person_address": return JSON.stringify(await getPersonAddress(extractId(input.id as string)));
      case "list_groups": return JSON.stringify(await listGroups(pagination()));

      // Payments
      case "list_invoices": return JSON.stringify(await listInvoices(pagination()));
      case "get_invoice": return JSON.stringify(await getInvoice(extractId(input.id as string)));
      case "list_payment_requests": return JSON.stringify(await listPaymentRequests(pagination()));
      case "get_payment_settings": return JSON.stringify(await getPaymentSettings());
      case "list_tax_receipts": return JSON.stringify(await listTaxReceipts(pagination()));

      // Accounting
      case "list_accounting_entries": return JSON.stringify(await listAccountingEntries(pagination()));
      case "list_accounting_years": return JSON.stringify(await listAccountingYears());
      case "list_accounting_budgets": return JSON.stringify(await listAccountingBudgets());
      case "get_general_ledger_totals": return JSON.stringify(await getGeneralLedgerTotals());
      case "list_expense_reports": return JSON.stringify(await listExpenseReports(pagination()));

      // Banking
      case "list_bank_accounts": return JSON.stringify(await listBankAccounts());
      case "list_bank_entries": return JSON.stringify(await listBankEntries(extractId(input.id as string), pagination()));
      case "get_bank_entries_balance": return JSON.stringify(await getBankEntriesBalance(extractId(input.id as string)));
      case "list_psp_sub_wallets": return JSON.stringify(await listPspSubWallets());
      case "get_psp_sub_wallet_balance": return JSON.stringify(await getPspSubWalletBalance(extractId(input.id as string)));

      // Website / Collects
      case "list_collects": return JSON.stringify(await listCollects(pagination()));
      case "get_collect": return JSON.stringify(await getCollect(extractId(input.id as string)));
      case "list_analytics_pages": return JSON.stringify(await listAnalyticsPages());

      // Emailing
      case "list_email_campaigns": return JSON.stringify(await listEmailCampaigns(pagination()));
      case "get_email_campaign": return JSON.stringify(await getEmailCampaign(extractId(input.id as string)));
      case "list_email_campaign_messages": return JSON.stringify(await listEmailCampaignMessages(extractId(input.id as string), pagination()));
      case "list_email_campaign_blocked_messages": return JSON.stringify(await listEmailCampaignBlockedMessages(extractId(input.id as string), pagination()));

      default: return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });

  let contextBlock = "";
  try {
    const [org, stats, contacts] = await Promise.all([getOrganization(), getStatsCrm(), getContactsSummary()]);
    contextBlock = `<association_context>
Organization: ${org.name}
Total contacts: ${contacts.total}
Total persons: ${stats.totalPersons ?? "N/A"}
Total organizations in CRM: ${stats.totalOrganizations ?? "N/A"}
Total members: ${stats.totalMembers ?? "N/A"}
Total active members: ${stats.totalActiveMembers ?? "N/A"}
</association_context>`;
  } catch {
    contextBlock = "<association_context>Could not load association data.</association_context>";
  }

  const client = new Anthropic({ apiKey });
  const systemWithContext = `${SYSTEM_PROMPT}\n\n${contextBlock}`;

  type ApiMessage = Anthropic.MessageParam;
  const apiMessages: ApiMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let currentMessages = apiMessages;

      while (true) {
        const response = await client.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 2048,
          system: systemWithContext,
          tools,
          messages: currentMessages,
        });

        const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
        const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");

        if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
          controller.enqueue(encoder.encode(textBlocks.map((b) => b.text).join("")));
          controller.close();
          break;
        }

        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block) => ({
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: await runTool(block.name, block.input as ToolInput),
          }))
        );

        currentMessages = [
          ...currentMessages,
          { role: "assistant" as const, content: response.content },
          { role: "user" as const, content: toolResults },
        ];
      }
    },
  });

  return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

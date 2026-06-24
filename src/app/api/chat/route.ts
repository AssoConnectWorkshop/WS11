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

You have tools spanning all modules: CRM, Payments, Accounting, Banking, Website/Forms, and Emailing.
Always use your tools to fetch real data when the user asks — never say you don't have access.

Workflow:
1. Call the relevant tool(s) first, then answer based on the real data returned.
2. Chain calls when needed (e.g. list bank accounts → then fetch balance per account).
3. Lead with the most important insight, then supporting details.
4. Suggest 1-2 next actions when relevant.

Report rules:
- Plain language, no jargon.
- Format numbers clearly (e.g. "1 234" not "1234").
- Use bullet points for lists, bold for key figures.
- Never make up data.

Style: Warm and helpful. Address the admin as "you". Use the association's name when you have it.`;

type Prop = { type: string; description: string };
function tool(name: string, description: string, properties: Record<string, Prop> = {}, required: string[] = []): Anthropic.Tool {
  return { name, description, input_schema: { type: "object" as const, properties, required } };
}
const PP: Record<string, Prop> = {
  page: { type: "number", description: "Page number (default 1)" },
  itemsPerPage: { type: "number", description: "Items per page (default 10, max 100)" },
};
const IP: Record<string, Prop> = { id: { type: "string", description: "Resource ULID" } };

const tools: Anthropic.Tool[] = [
  tool("get_stats_crm", "CRM summary: total contacts, persons, org-contacts, members, active members."),
  tool("list_contacts", "List contacts (ID, type, email).", { ...PP, type: { type: "string", description: "Filter: 'person' or 'organization'" } }),
  tool("get_contact", "Full details for one contact.", IP, ["id"]),
  tool("get_person", "Name and DOB for a person.", IP, ["id"]),
  tool("get_person_address", "Postal address of a person.", IP, ["id"]),
  tool("list_groups", "Sub-groups / sections.", PP),
  tool("list_invoices", "All invoices.", PP),
  tool("get_invoice", "Single invoice details.", IP, ["id"]),
  tool("list_payment_requests", "Payment requests.", PP),
  tool("get_payment_settings", "Payment configuration."),
  tool("list_tax_receipts", "Tax receipts issued.", PP),
  tool("list_accounting_entries", "Accounting transactions.", PP),
  tool("list_accounting_years", "Fiscal years."),
  tool("list_accounting_budgets", "Accounting budgets."),
  tool("get_general_ledger_totals", "Aggregated ledger balances per account."),
  tool("list_expense_reports", "Expense reports.", PP),
  tool("list_bank_accounts", "Bank accounts linked to the org."),
  tool("list_bank_entries", "Bank transactions for a bank account.", { id: { type: "string", description: "Bank account ULID" }, ...PP }, ["id"]),
  tool("get_bank_entries_balance", "Current balance of a bank account.", { id: { type: "string", description: "Bank account ULID" } }, ["id"]),
  tool("list_psp_sub_wallets", "PSP sub-wallets."),
  tool("get_psp_sub_wallet_balance", "Balance of a PSP sub-wallet.", { id: { type: "string", description: "PSP sub-wallet ULID" } }, ["id"]),
  tool("list_collects", "Online forms (membership, donation, event, product).", PP),
  tool("get_collect", "Details of a form/collect.", IP, ["id"]),
  tool("list_analytics_pages", "Website page analytics."),
  tool("list_email_campaigns", "Email campaigns.", PP),
  tool("get_email_campaign", "Details and stats for one campaign.", IP, ["id"]),
  tool("list_email_campaign_messages", "Messages sent within a campaign.", { id: { type: "string", description: "Campaign ULID" }, ...PP }, ["id"]),
  tool("list_email_campaign_blocked_messages", "Bounced/blocked messages for a campaign.", { id: { type: "string", description: "Campaign ULID" }, ...PP }, ["id"]),
];

type ToolInput = Record<string, unknown>;

function extractId(v: string) { return (v ?? "").split("/").pop() ?? v; }

async function runTool(name: string, input: ToolInput): Promise<unknown> {
  const p = (key: string) => input[key] as number | undefined;
  const pg = (extra?: Record<string, unknown>) => ({ page: p("page"), itemsPerPage: p("itemsPerPage") ?? 10, ...extra });
  switch (name) {
    case "get_stats_crm": return getStatsCrm();
    case "list_contacts": return listContacts({ ...pg(), type: input.type as string | undefined });
    case "get_contact": return getContact(extractId(input.id as string));
    case "get_person": return getPerson(extractId(input.id as string));
    case "get_person_address": return getPersonAddress(extractId(input.id as string));
    case "list_groups": return listGroups(pg());
    case "list_invoices": return listInvoices(pg());
    case "get_invoice": return getInvoice(extractId(input.id as string));
    case "list_payment_requests": return listPaymentRequests(pg());
    case "get_payment_settings": return getPaymentSettings();
    case "list_tax_receipts": return listTaxReceipts(pg());
    case "list_accounting_entries": return listAccountingEntries(pg());
    case "list_accounting_years": return listAccountingYears();
    case "list_accounting_budgets": return listAccountingBudgets();
    case "get_general_ledger_totals": return getGeneralLedgerTotals();
    case "list_expense_reports": return listExpenseReports(pg());
    case "list_bank_accounts": return listBankAccounts();
    case "list_bank_entries": return listBankEntries(extractId(input.id as string), pg());
    case "get_bank_entries_balance": return getBankEntriesBalance(extractId(input.id as string));
    case "list_psp_sub_wallets": return listPspSubWallets();
    case "get_psp_sub_wallet_balance": return getPspSubWalletBalance(extractId(input.id as string));
    case "list_collects": return listCollects(pg());
    case "get_collect": return getCollect(extractId(input.id as string));
    case "list_analytics_pages": return listAnalyticsPages();
    case "list_email_campaigns": return listEmailCampaigns(pg());
    case "get_email_campaign": return getEmailCampaign(extractId(input.id as string));
    case "list_email_campaign_messages": return listEmailCampaignMessages(extractId(input.id as string), pg());
    case "list_email_campaign_blocked_messages": return listEmailCampaignBlockedMessages(extractId(input.id as string), pg());
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

function line(obj: unknown) { return JSON.stringify(obj) + "\n"; }

export async function POST(req: Request) {
  const { messages } = await req.json() as { messages: { role: "user" | "assistant"; content: string }[] };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });

  let contextBlock = "";
  try {
    const [org, stats, contacts] = await Promise.all([getOrganization(), getStatsCrm(), getContactsSummary()]);
    contextBlock = `<association_context>
Organization: ${org.name}
Total contacts: ${contacts.total}
Total persons: ${stats.totalPersons ?? "N/A"}
Total org-contacts in CRM: ${stats.totalOrganizations ?? "N/A"}
Total members: ${stats.totalMembers ?? "N/A"}
Total active members: ${stats.totalActiveMembers ?? "N/A"}
</association_context>`;
  } catch {
    contextBlock = "<association_context>Could not load association data.</association_context>";
  }

  const client = new Anthropic({ apiKey });
  const systemWithContext = `${SYSTEM_PROMPT}\n\n${contextBlock}`;

  type ApiMessage = Anthropic.MessageParam;
  let currentMessages: ApiMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const emit = (obj: unknown) => controller.enqueue(encoder.encode(line(obj)));

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
          emit({ type: "text", chunk: textBlocks.map((b) => b.text).join("") });
          controller.close();
          break;
        }

        // Execute tools, stream viz events in parallel
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block) => {
            let result: unknown;
            try {
              result = await runTool(block.name, block.input as ToolInput);
              emit({ type: "viz", tool: block.name, data: result });
            } catch (err) {
              result = { error: String(err) };
            }
            return { type: "tool_result" as const, tool_use_id: block.id, content: JSON.stringify(result) };
          })
        );

        currentMessages = [
          ...currentMessages,
          { role: "assistant" as const, content: response.content },
          { role: "user" as const, content: toolResults },
        ];
      }
    },
  });

  return new Response(readable, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
}

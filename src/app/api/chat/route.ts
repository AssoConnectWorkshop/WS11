import Anthropic from "@anthropic-ai/sdk";
import {
  getStatsCrm,
  getContactsSummary,
  getOrganization,
  listContacts,
  getContact,
  getPerson,
  getPersonAddress,
} from "@/lib/assoconnect";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an analytics assistant embedded in AssoConnect, a SaaS platform for nonprofit associations.
Your job: turn association data into clear, actionable insight for non-technical admins.

You have tools to fetch live data from the AssoConnect API. Use them whenever the user asks about contacts, addresses, members, or any specific data. Always fetch real data rather than saying you don't have access.

Workflow:
1. When asked about data, use your tools to fetch it first, then answer.
2. Lead with the most important insight, then supporting details.
3. Suggest 1-2 next actions when relevant.
4. If asked a question, answer it directly and concisely.

Report rules:
- Use plain language — no jargon, no technical terms.
- Format numbers clearly (e.g. "1 234 members" not "1234").
- Use bullet points for lists, bold for key numbers.
- Keep responses focused unless the question requires more detail.
- Never make up data.

Design guidelines:
- Be warm and helpful, not robotic.
- Address the admin as "you".
- Use the association's name when you have it.`;

const tools: Anthropic.Tool[] = [
  {
    name: "list_contacts",
    description: "List contacts from the organization CRM. Returns contact IDs, types, emails, and relation data. Use this to get contacts you can then look up individually.",
    input_schema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (default 1)" },
        itemsPerPage: { type: "number", description: "Number of contacts per page (default 10, max 100)" },
        type: { type: "string", description: "Filter by contact type (e.g. 'person' or 'organization')" },
      },
    },
  },
  {
    name: "get_contact",
    description: "Get full details for a single contact by their ID (the ULID part of their @id, e.g. '01ABC...').",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "The contact ULID identifier" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_person",
    description: "Get personal details (first name, last name, date of birth) for a person contact.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "The person ULID identifier" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_person_address",
    description: "Get the postal address for a person.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "The person ULID identifier" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_stats_crm",
    description: "Get CRM statistics: total contacts, persons, organizations, members, and active members.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
];

type ToolInput = Record<string, unknown>;

async function runTool(name: string, input: ToolInput): Promise<string> {
  const ulid = process.env.ASSOCONNECT_ORGANIZATION_ULID;

  function extractId(iriOrId: string) {
    return iriOrId.split("/").pop() ?? iriOrId;
  }

  try {
    if (name === "list_contacts") {
      const result = await listContacts({
        page: input.page as number | undefined,
        itemsPerPage: (input.itemsPerPage as number | undefined) ?? 10,
        type: input.type as string | undefined,
        ulid,
      });
      return JSON.stringify({
        total: result["hydra:totalItems"],
        contacts: result["hydra:member"].map((c) => ({
          id: extractId(c["@id"]),
          type: c.type,
          email: c.email,
          raw: c,
        })),
      });
    }

    if (name === "get_contact") {
      const result = await getContact(extractId(input.id as string));
      return JSON.stringify(result);
    }

    if (name === "get_person") {
      const result = await getPerson(extractId(input.id as string));
      return JSON.stringify(result);
    }

    if (name === "get_person_address") {
      const result = await getPersonAddress(extractId(input.id as string));
      return JSON.stringify(result);
    }

    if (name === "get_stats_crm") {
      const result = await getStatsCrm(ulid);
      return JSON.stringify(result);
    }

    return JSON.stringify({ error: `Unknown tool: ${name}` });
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
  }

  let contextBlock = "";
  try {
    const [org, stats, contacts] = await Promise.all([
      getOrganization(),
      getStatsCrm(),
      getContactsSummary(),
    ]);
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

  // Agentic loop: keep calling Claude until it stops using tools
  type ApiMessage = Anthropic.MessageParam;
  const apiMessages: ApiMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let finalText = "";

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let currentMessages = apiMessages;

      while (true) {

        // For tool-use iterations we don't stream (can't stream mid-loop easily)
        // We only stream the final text response
        const response = await client.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 2048,
          system: systemWithContext,
          tools,
          messages: currentMessages,
        });

        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        const textBlocks = response.content.filter(
          (b): b is Anthropic.TextBlock => b.type === "text"
        );

        if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
          // Final response — stream it
          finalText = textBlocks.map((b) => b.text).join("");
          controller.enqueue(encoder.encode(finalText));
          controller.close();
          break;
        }

        // Execute all tool calls in parallel
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

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

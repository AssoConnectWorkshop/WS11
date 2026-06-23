import Anthropic from "@anthropic-ai/sdk";
import { getStatsCrm, getContactsSummary, getOrganization } from "@/lib/assoconnect";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an analytics assistant embedded in AssoConnect, a SaaS platform for nonprofit associations.
Your job: turn association data into clear, actionable insight for non-technical admins.

Workflow:
1. When given association data (contacts, members, stats), analyze it and surface what matters most.
2. Lead with the most important insight, then supporting details.
3. Suggest 1-2 next actions the admin could take based on the data.
4. If asked a question, answer it directly and concisely.

Report rules:
- Use plain language — no jargon, no technical terms.
- Format numbers clearly (e.g. "1 234 members" not "1234").
- Use bullet points for lists, bold for key numbers.
- Keep responses focused and under 300 words unless the question requires more.
- Never make up data. If something is not in the provided context, say so.

Design guidelines:
- Be warm and helpful, not robotic.
- Address the admin as "you" (not "the organization" or "the user").
- Use the association's name when you have it.`;

export async function POST(req: Request) {
  const { messages } = await req.json() as { messages: { role: "user" | "assistant"; content: string }[] };

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

  const stream = await client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: systemWithContext,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

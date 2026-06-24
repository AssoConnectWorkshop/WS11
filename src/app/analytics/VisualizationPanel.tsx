"use client";

import React from "react";

export type VizItem = { tool: string; data: unknown; id: number };

// ─── Primitives ──────────────────────────────────────────────────────────────

function VizCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--color-white)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-xl)",
      padding: "1rem",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.875rem", color: "var(--color-text-title)", letterSpacing: "-0.3px", margin: 0 }}>
          {title}
        </h3>
        {subtitle && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "var(--color-text-muted)", margin: "0.125rem 0 0" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StatGrid({ items }: { items: { label: string; value: string | number; accent?: boolean }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "var(--gap-s)" }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: item.accent ? "var(--color-bg-blue)" : "var(--color-bg-grey)",
          borderRadius: "var(--radius-md)",
          padding: "0.75rem 0.625rem",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", color: item.accent ? "var(--color-primary)" : "var(--color-text-title)", letterSpacing: "-1px", lineHeight: 1.1 }}>
            {typeof item.value === "number" ? item.value.toLocaleString("fr-FR") : item.value}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: "0.25rem", lineHeight: 1.3 }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function HBarChart({ data, maxBars = 12 }: { data: { label: string; value: number }[]; maxBars?: number }) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, maxBars).filter(d => d.value > 0);
  if (!sorted.length) return null;
  const max = Math.max(...sorted.map(d => d.value), 1);
  const barH = 20, gap = 6, labelW = 120, chartW = 150;
  const totalH = sorted.length * (barH + gap) + 4;
  return (
    <svg viewBox={`0 0 ${labelW + chartW + 60} ${totalH}`} width="100%" style={{ display: "block" }}>
      {sorted.map((d, i) => {
        const y = i * (barH + gap);
        const w = Math.max((d.value / max) * chartW, 2);
        return (
          <g key={i}>
            <text x={labelW - 6} y={y + barH / 2 + 4} textAnchor="end" fontSize={10} fill="var(--color-text-body)" fontFamily="Roboto, sans-serif">
              {d.label.length > 16 ? d.label.slice(0, 16) + "…" : d.label}
            </text>
            <rect x={labelW} y={y} width={w} height={barH} rx={4} fill="var(--color-primary)" opacity={0.78} />
            <text x={labelW + w + 5} y={y + barH / 2 + 4} fontSize={10} fill="var(--color-text-muted)" fontFamily="Roboto, sans-serif">
              {d.value.toLocaleString("fr-FR")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const DONUT_COLORS = ["#316BF2", "#87DFD5", "#F6C131", "#CDDCFF", "#0040D7", "#00C1A2"];

function DonutChart({ data }: { data: { label: string; value: number }[] }) {
  const filtered = data.filter(d => d.value > 0).slice(0, 6);
  const total = filtered.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  const cx = 65, cy = 65, r = 52, ir = 30;
  let angle = -Math.PI / 2;
  const slices = filtered.map((d, i) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const safe = Math.min(sweep, 2 * Math.PI - 0.001);
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + safe), y2 = cy + r * Math.sin(angle + safe);
    const ix1 = cx + ir * Math.cos(angle + safe), iy1 = cy + ir * Math.sin(angle + safe);
    const ix2 = cx + ir * Math.cos(angle), iy2 = cy + ir * Math.sin(angle);
    angle += sweep;
    return {
      path: `M${x1} ${y1} A${r} ${r} 0 ${safe > Math.PI ? 1 : 0} 1 ${x2} ${y2} L${ix1} ${iy1} A${ir} ${ir} 0 ${safe > Math.PI ? 1 : 0} 0 ${ix2} ${iy2}Z`,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      label: d.label,
      value: d.value,
      pct: Math.round((d.value / total) * 100),
    };
  });
  return (
    <svg viewBox="0 0 290 140" width="100%">
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize={18} fontWeight={600} fill="var(--color-text-title)" fontFamily="Poppins, sans-serif">{total.toLocaleString("fr-FR")}</text>
      <text x={cx} y={cx + 10} textAnchor="middle" fontSize={9} fill="var(--color-text-muted)" fontFamily="Roboto, sans-serif">total</text>
      {slices.map((s, i) => (
        <g key={i} transform={`translate(142, ${8 + i * 22})`}>
          <rect width={10} height={10} rx={2} fill={s.color} />
          <text x={14} y={9} fontSize={9.5} fill="var(--color-text-body)" fontFamily="Roboto, sans-serif">
            {s.label.length > 16 ? s.label.slice(0, 16) + "…" : s.label}: {s.value.toLocaleString("fr-FR")} ({s.pct}%)
          </text>
        </g>
      ))}
    </svg>
  );
}

function DataTable({ rows, columns, total }: {
  rows: Record<string, unknown>[];
  columns: { key: string; label: string; fmt?: (v: unknown, row: Record<string, unknown>) => string }[];
  total?: number;
}) {
  const MAX = 8;
  const shown = rows.slice(0, MAX);
  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Roboto, sans-serif", fontSize: "0.6875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {columns.map(c => (
                <th key={c.key} style={{ textAlign: "left", padding: "0.3rem 0.5rem", color: "var(--color-text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 ? "var(--color-bg-grey)" : "transparent" }}>
                {columns.map(c => {
                  const val = c.fmt ? c.fmt(row[c.key], row) : String(row[c.key] ?? "—");
                  return (
                    <td key={c.key} style={{ padding: "0.3rem 0.5rem", color: "var(--color-text-body)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={val}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(total ?? rows.length) > MAX && (
        <p style={{ fontFamily: "Roboto, sans-serif", fontSize: "0.625rem", color: "var(--color-text-muted)", marginTop: "0.25rem", textAlign: "right" }}>
          {shown.length} of {(total ?? rows.length).toLocaleString("fr-FR")}
        </p>
      )}
    </div>
  );
}

function KeyValueCard({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([k]) => !k.startsWith("@") && k !== "hydra:context");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {entries.slice(0, 12).map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: "0.5rem", fontFamily: "Roboto, sans-serif", fontSize: "0.6875rem" }}>
          <span style={{ color: "var(--color-text-muted)", minWidth: "120px", flexShrink: 0 }}>{k}</span>
          <span style={{ color: "var(--color-text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Per-tool renderers ───────────────────────────────────────────────────────

type R = Record<string, unknown>;

function renderStatsCrm(d: R) {
  return (
    <VizCard title="CRM Overview">
      <StatGrid items={[
        { label: "Total contacts", value: (d.totalContacts as number) ?? 0, accent: true },
        { label: "Persons", value: (d.totalPersons as number) ?? 0 },
        { label: "Org contacts", value: (d.totalOrganizations as number) ?? 0 },
        { label: "Members", value: (d.totalMembers as number) ?? 0, accent: true },
        { label: "Active members", value: (d.totalActiveMembers as number) ?? 0, accent: true },
      ]} />
    </VizCard>
  );
}


function renderHydraCollection(tool: string, members: R[], total: number) {
  const label = tool.replace(/_/g, " ").replace(/^list /, "");

  if (tool === "list_contacts") {
    const byStatus: Record<string, number> = {};
    members.forEach(c => {
      const s = String((c.customFields as R)?.Statut ?? "—");
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    });
    const hasStatuses = Object.keys(byStatus).length > 1;
    return (
      <VizCard title="Contacts" subtitle={`${total.toLocaleString("fr-FR")} total`}>
        {hasStatuses && (
          <div style={{ marginBottom: "0.75rem" }}>
            <DonutChart data={Object.entries(byStatus).map(([l, v]) => ({ label: l, value: v }))} />
          </div>
        )}
        <DataTable rows={members} total={total} columns={[
          { key: "firstname", label: "First name", fmt: v => String(v ?? "—") },
          { key: "lastname", label: "Last name", fmt: v => String(v ?? "—") },
          { key: "email", label: "Email", fmt: v => v ? String(v) : "—" },
          { key: "postalAddress", label: "City", fmt: v => v ? String((v as R).city ?? "—") : "—" },
          { key: "customFields", label: "Status", fmt: v => v ? String((v as R).Statut ?? "—") : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_invoices") {
    return (
      <VizCard title="Invoices" subtitle={`${total.toLocaleString("fr-FR")} total`}>
        <DataTable rows={members} total={total} columns={[
          { key: "@id", label: "ID", fmt: v => String(v ?? "").split("/").pop()?.slice(0, 10) + "…" },
          { key: "totalAmount", label: "Amount", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Date", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_accounting_entries") {
    const byAccount: Record<string, number> = {};
    members.forEach(e => {
      const acc = String(e.accountNumber ?? e.account ?? "other");
      byAccount[acc] = (byAccount[acc] ?? 0) + 1;
    });
    return (
      <VizCard title="Accounting Entries" subtitle={`${total.toLocaleString("fr-FR")} entries`}>
        {Object.keys(byAccount).length > 1 && <HBarChart data={Object.entries(byAccount).map(([label, value]) => ({ label, value }))} />}
        <DataTable rows={members} total={total} columns={[
          { key: "date", label: "Date", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
          { key: "label", label: "Label", fmt: (v, row) => String(v ?? row.description ?? row.name ?? "—") },
          { key: "debit", label: "Debit", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
          { key: "credit", label: "Credit", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_accounting_years") {
    return (
      <VizCard title="Fiscal Years" subtitle={`${total} years`}>
        <DataTable rows={members} total={total} columns={[
          { key: "name", label: "Name", fmt: (v, row) => String(v ?? row.label ?? "—") },
          { key: "startAt", label: "Start", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
          { key: "endAt", label: "End", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
          { key: "status", label: "Status" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_bank_entries") {
    return (
      <VizCard title="Bank Transactions" subtitle={`${total.toLocaleString("fr-FR")} entries`}>
        <DataTable rows={members} total={total} columns={[
          { key: "date", label: "Date", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
          { key: "label", label: "Label", fmt: (v, row) => String(v ?? row.description ?? "—") },
          { key: "amount", label: "Amount", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
          { key: "balance", label: "Balance", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_email_campaigns") {
    return (
      <VizCard title="Email Campaigns" subtitle={`${total.toLocaleString("fr-FR")} campaigns`}>
        <DataTable rows={members} total={total} columns={[
          { key: "name", label: "Name", fmt: (v, row) => String(v ?? row.subject ?? row.title ?? "—") },
          { key: "status", label: "Status" },
          { key: "sentAt", label: "Sent", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
          { key: "totalRecipients", label: "Recipients", fmt: v => v != null ? Number(v).toLocaleString("fr-FR") : "—" },
          { key: "openRate", label: "Open %", fmt: v => v != null ? `${Math.round(Number(v) * 100)}%` : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_collects") {
    const byType: Record<string, number> = {};
    members.forEach(c => {
      const t = String(c["@type"] ?? c.type ?? "collect");
      byType[t] = (byType[t] ?? 0) + 1;
    });
    return (
      <VizCard title="Online Forms" subtitle={`${total.toLocaleString("fr-FR")} forms`}>
        {Object.keys(byType).length > 1 && <div style={{ marginBottom: "0.75rem" }}><DonutChart data={Object.entries(byType).map(([l, v]) => ({ label: l.replace("Collect", ""), value: v }))} /></div>}
        <DataTable rows={members} total={total} columns={[
          { key: "name", label: "Name", fmt: (v, row) => String(v ?? row.title ?? "—") },
          { key: "@type", label: "Type", fmt: v => String(v ?? "—").replace("Collect", "") },
          { key: "status", label: "Status" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_groups") {
    return (
      <VizCard title="Groups / Sections" subtitle={`${total.toLocaleString("fr-FR")} groups`}>
        <DataTable rows={members} total={total} columns={[
          { key: "name", label: "Name" },
          { key: "type", label: "Type" },
          { key: "isAdvanced", label: "Advanced", fmt: v => v ? "Yes" : "No" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_payment_requests") {
    return (
      <VizCard title="Payment Requests" subtitle={`${total.toLocaleString("fr-FR")} requests`}>
        <DataTable rows={members} total={total} columns={[
          { key: "title", label: "Title", fmt: (v, row) => String(v ?? row.name ?? "—") },
          { key: "amount", label: "Amount", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Date", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_tax_receipts") {
    return (
      <VizCard title="Tax Receipts" subtitle={`${total.toLocaleString("fr-FR")} receipts`}>
        <DataTable rows={members} total={total} columns={[
          { key: "number", label: "No.", fmt: (v, row) => String(v ?? row.reference ?? "—") },
          { key: "amount", label: "Amount", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
          { key: "date", label: "Date", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_expense_reports") {
    return (
      <VizCard title="Expense Reports" subtitle={`${total.toLocaleString("fr-FR")} reports`}>
        <DataTable rows={members} total={total} columns={[
          { key: "title", label: "Title", fmt: (v, row) => String(v ?? row.name ?? "—") },
          { key: "amount", label: "Amount", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Date", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_bank_accounts") {
    return (
      <VizCard title="Bank Accounts" subtitle={`${total} accounts`}>
        <DataTable rows={members} total={total} columns={[
          { key: "name", label: "Name", fmt: (v, row) => String(v ?? row.label ?? "—") },
          { key: "iban", label: "IBAN" },
          { key: "balance", label: "Balance", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_psp_sub_wallets") {
    return (
      <VizCard title="PSP Wallets" subtitle={`${total} wallets`}>
        <DataTable rows={members} total={total} columns={[
          { key: "name", label: "Name", fmt: (v, row) => String(v ?? row.label ?? "—") },
          { key: "currency", label: "Currency" },
          { key: "status", label: "Status" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_email_campaign_messages") {
    return (
      <VizCard title="Campaign Messages" subtitle={`${total.toLocaleString("fr-FR")} sent`}>
        <DataTable rows={members} total={total} columns={[
          { key: "email", label: "Email", fmt: (v, row) => String(v ?? row.recipient ?? "—") },
          { key: "status", label: "Status" },
          { key: "openedAt", label: "Opened", fmt: v => v ? new Date(v as string).toLocaleDateString("fr-FR") : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "list_accounting_budgets") {
    return (
      <VizCard title="Accounting Budgets" subtitle={`${total} budgets`}>
        <HBarChart data={members.map(m => ({
          label: String(m.name ?? m.label ?? m["@id"]).split("/").pop() ?? "—",
          value: Number(m.amount ?? m.total ?? 0),
        }))} />
        <DataTable rows={members} total={total} columns={[
          { key: "name", label: "Name", fmt: (v, row) => String(v ?? row.label ?? "—") },
          { key: "amount", label: "Amount", fmt: v => v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—" },
        ]} />
      </VizCard>
    );
  }

  // Generic fallback for any collection
  if (members.length === 0) {
    return (
      <VizCard title={label} subtitle="No data returned">
        <p style={{ fontFamily: "Roboto, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Empty result set.</p>
      </VizCard>
    );
  }

  const cols = Object.keys(members[0]).filter(k => !k.startsWith("@")).slice(0, 5).map(k => ({ key: k, label: k }));
  return (
    <VizCard title={label} subtitle={`${total.toLocaleString("fr-FR")} results`}>
      <DataTable rows={members} total={total} columns={cols} />
    </VizCard>
  );
}

function renderSingle(tool: string, d: R) {
  if (tool === "get_bank_entries_balance") {
    return (
      <VizCard title="Account Balance">
        <StatGrid items={[
          { label: "Balance", value: d.balance != null ? `${Number(d.balance).toLocaleString("fr-FR")} €` : "N/A", accent: true },
          { label: "Pending", value: d.pendingBalance != null ? `${Number(d.pendingBalance).toLocaleString("fr-FR")} €` : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "get_psp_sub_wallet_balance") {
    return (
      <VizCard title="Wallet Balance">
        <StatGrid items={[
          { label: "Available", value: d.availableBalance != null ? `${Number(d.availableBalance).toLocaleString("fr-FR")} €` : "N/A", accent: true },
          { label: "Blocked", value: d.blockedBalance != null ? `${Number(d.blockedBalance).toLocaleString("fr-FR")} €` : "—" },
        ]} />
      </VizCard>
    );
  }

  if (tool === "get_payment_settings") {
    const entries = Object.entries(d).filter(([k]) => !k.startsWith("@")).slice(0, 8);
    return (
      <VizCard title="Payment Settings">
        <StatGrid items={entries.map(([k, v]) => ({ label: k, value: String(v ?? "—") }))} />
      </VizCard>
    );
  }

  if (tool === "get_general_ledger_totals") {
    const entries = Object.entries(d).filter(([k]) => !k.startsWith("@") && typeof d[k] === "number");
    return (
      <VizCard title="General Ledger Totals">
        {entries.length > 0
          ? <HBarChart data={entries.map(([label, value]) => ({ label, value: Math.abs(value as number) }))} />
          : <KeyValueCard data={d} />}
      </VizCard>
    );
  }

  if (tool === "get_email_campaign") {
    return (
      <VizCard title="Email Campaign" subtitle={String(d.name ?? d.subject ?? "")}>
        <StatGrid items={[
          { label: "Recipients", value: Number(d.totalRecipients ?? 0), accent: true },
          { label: "Open rate", value: d.openRate != null ? `${Math.round(Number(d.openRate) * 100)}%` : "—", accent: true },
          { label: "Click rate", value: d.clickRate != null ? `${Math.round(Number(d.clickRate) * 100)}%` : "—" },
          { label: "Status", value: String(d.status ?? "—") },
        ]} />
      </VizCard>
    );
  }

  if (tool === "get_collect") {
    return (
      <VizCard title={String(d.name ?? d.title ?? "Collect")} subtitle={String(d["@type"] ?? "").replace("Collect", "") + " form"}>
        <KeyValueCard data={d} />
      </VizCard>
    );
  }

  if (tool === "get_person" || tool === "get_contact") {
    return (
      <VizCard title={[d.firstname, d.lastname].filter(Boolean).join(" ") || (String(d["@id"] ?? "").split("/").pop() ?? "Contact")} subtitle={String(d.email ?? d.type ?? "")}>
        <KeyValueCard data={d} />
      </VizCard>
    );
  }

  if (tool === "get_person_address") {
    const parts = [d.street1, d.street2, d.postal, d.city, d.country].filter(Boolean);
    return (
      <VizCard title="Address">
        <p style={{ fontFamily: "Roboto, sans-serif", fontSize: "0.875rem", color: "var(--color-text-body)", margin: 0, lineHeight: 1.6 }}>
          {parts.map((p, i) => <span key={i}>{String(p)}<br /></span>)}
        </p>
      </VizCard>
    );
  }

  if (tool === "get_invoice") {
    return (
      <VizCard title="Invoice" subtitle={String(d["@id"] ?? "").split("/").pop()}>
        <StatGrid items={[
          { label: "Amount", value: d.totalAmount != null ? `${Number(d.totalAmount).toLocaleString("fr-FR")} €` : "—", accent: true },
          { label: "Status", value: String(d.status ?? "—") },
          { label: "Date", value: d.createdAt ? new Date(d.createdAt as string).toLocaleDateString("fr-FR") : "—" },
        ]} />
      </VizCard>
    );
  }

  const label = tool.replace(/_/g, " ").replace(/^get /, "");
  return (
    <VizCard title={label}>
      <KeyValueCard data={d} />
    </VizCard>
  );
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

function renderItem(tool: string, data: unknown): React.ReactNode {
  if (!data || typeof data !== "object") return null;
  const d = data as R;

  if (tool === "get_stats_crm") return renderStatsCrm(d);

  // Hydra collections
  if (Array.isArray(d["hydra:member"])) {
    return renderHydraCollection(tool, d["hydra:member"] as R[], (d["hydra:totalItems"] as number) ?? (d["hydra:member"] as R[]).length);
  }

  return renderSingle(tool, d);
}

// ─── Panel ───────────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  get_stats_crm: "CRM Stats",
  list_contacts: "Contacts",
  get_contact: "Contact",
  get_person: "Person",
  get_person_address: "Address",
  list_groups: "Groups",
  list_invoices: "Invoices",
  get_invoice: "Invoice",
  list_payment_requests: "Payment Requests",
  get_payment_settings: "Payment Settings",
  list_tax_receipts: "Tax Receipts",
  list_accounting_entries: "Accounting Entries",
  list_accounting_years: "Fiscal Years",
  list_accounting_budgets: "Budgets",
  get_general_ledger_totals: "Ledger Totals",
  list_expense_reports: "Expense Reports",
  list_bank_accounts: "Bank Accounts",
  list_bank_entries: "Bank Transactions",
  get_bank_entries_balance: "Account Balance",
  list_psp_sub_wallets: "PSP Wallets",
  get_psp_sub_wallet_balance: "Wallet Balance",
  list_collects: "Online Forms",
  get_collect: "Form",
  list_analytics_pages: "Page Analytics",
  list_email_campaigns: "Email Campaigns",
  get_email_campaign: "Campaign",
  list_email_campaign_messages: "Campaign Messages",
  list_email_campaign_blocked_messages: "Blocked Messages",
};

export default function VisualizationPanel({ items }: { items: VizItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--color-text-muted)", fontFamily: "Roboto, sans-serif" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.4 }}>📊</div>
        <p style={{ fontSize: "0.875rem", textAlign: "center", maxWidth: "200px", lineHeight: 1.5 }}>
          Data visualizations will appear here as you chat
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-m)" }}>
      {[...items].reverse().map((item) => (
        <div key={item.id} style={{ animation: "fadeSlideIn var(--duration-enter) var(--easing-standard)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
            <span style={{
              fontFamily: "Roboto, sans-serif",
              fontSize: "0.625rem",
              fontWeight: 500,
              color: "var(--color-primary)",
              background: "var(--color-bg-blue)",
              padding: "0.125rem 0.5rem",
              borderRadius: "var(--radius-sm)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              {TOOL_LABELS[item.tool] ?? item.tool}
            </span>
          </div>
          {renderItem(item.tool, item.data)}
        </div>
      ))}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

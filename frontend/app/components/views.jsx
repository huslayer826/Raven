import {
  DEMO_SAMPLE, DEMO_PAYLOAD, OBFUSCATION_LAYERS, KILL_CHAIN, C2_CONFIG, ANTI_ANALYSIS,
  TARGETED_APPS, MITRE, REMEDIATION, DETECTIONS, RUN_METRICS,
} from "./demoData";

export const MONO = "'IBM Plex Mono', monospace";

// ── Shared primitives ──────────────────────────────────────────────

export function Panel({ title, right, children, style }) {
  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12,
      padding: "20px 24px", ...style,
    }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Label>{title}</Label>
          {right && <div style={{ fontSize: 11, fontFamily: MONO, color: "#A8A29E" }}>{right}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <div style={{ color: "#D6D3D1", fontSize: 13, padding: "48px 0", textAlign: "center" }}>{children}</div>;
}

function KV({ rows, keyWidth = 130 }) {
  return (
    <div>
      {rows.map(([k, v], i) => (
        <div key={k} style={{
          display: "flex", gap: 12, padding: "8px 0", fontSize: 13,
          borderBottom: i < rows.length - 1 ? "1px solid #F5F5F4" : "none",
        }}>
          <span style={{ width: keyWidth, flexShrink: 0, color: "#78716C" }}>{k}</span>
          <span style={{ fontFamily: MONO, color: "#1C1917", wordBreak: "break-all", fontSize: 12.5 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function Grid({ cols = 2, gap = 20, children, style }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap, ...style }}>{children}</div>;
}

// ── Kill chain + MITRE (used on Investigation) ─────────────────────

export function KillChain() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
      {KILL_CHAIN.map((s, i) => (
        <div key={s.stage} style={{ position: "relative" }}>
          <div style={{
            border: "1px solid #E7E5E4", borderRadius: 10, padding: "14px 16px", height: "100%",
            background: i === 3 ? "#1C1917" : "#FFFFFF", color: i === 3 ? "#FAFAF9" : "#1C1917",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: i === 3 ? "#A8A29E" : "#A8A29E" }}>STAGE {s.stage}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: i === 3 ? "#FCA5A5" : "#991B1B" }}>{s.tech}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{s.title}</div>
            <div style={{ fontSize: 12, lineHeight: 1.55, color: i === 3 ? "#D6D3D1" : "#78716C" }}>{s.detail}</div>
          </div>
          {i < KILL_CHAIN.length - 1 && (
            <div style={{
              position: "absolute", right: -11, top: "50%", transform: "translateY(-50%)", zIndex: 1,
              width: 10, height: 10, borderTop: "1.5px solid #A8A29E", borderRight: "1.5px solid #A8A29E",
              rotate: "45deg", marginRight: 2,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

const TACTIC_ORDER = ["Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Collection", "Command and Control"];

export function MitreMatrix() {
  const tactics = TACTIC_ORDER.filter(t => MITRE.some(m => m.tactic === t));
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${tactics.length}, minmax(0,1fr))`, gap: 8 }}>
      {tactics.map(t => (
        <div key={t}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#44403C", marginBottom: 8, minHeight: 28, lineHeight: 1.25 }}>{t}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {MITRE.filter(m => m.tactic === t).map(m => (
              <div key={m.id} style={{
                padding: "6px 8px", borderRadius: 6,
                background: t === "Defense Evasion" ? "#FEF2F2" : "#F5F5F4",
                border: `1px solid ${t === "Defense Evasion" ? "#FECACA" : "#E7E5E4"}`,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: t === "Defense Evasion" ? "#991B1B" : "#78716C" }}>{m.id}</div>
                <div style={{ fontSize: 11, color: "#1C1917", lineHeight: 1.3, marginTop: 1 }}>{m.name}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Evidence ───────────────────────────────────────────────────────

export function EvidenceView({ ready, findings, IocTable }) {
  if (!ready) return <Panel><Empty>Run an analysis to collect static artifacts</Empty></Panel>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Grid>
        <Panel title="Sample · JS dropper">
          <KV rows={[
            ["File", DEMO_SAMPLE.name], ["Type", DEMO_SAMPLE.type], ["Size", DEMO_SAMPLE.size],
            ["MD5", DEMO_SAMPLE.md5], ["SHA-256", DEMO_SAMPLE.sha256], ["TLSH", DEMO_SAMPLE.tlsh],
          ]} keyWidth={80} />
        </Panel>
        <Panel title="Recovered payload · .NET RAT">
          <KV rows={[
            ["File", DEMO_PAYLOAD.name], ["Size", "245 KB · compiled 2024-01-18"],
            ["MD5", DEMO_PAYLOAD.md5], ["SHA-256", DEMO_PAYLOAD.sha256],
            ["Cipher", "AES-256-CBC · hardcoded key + IV"], ["Loader", "[Reflection.Assembly]::Load()"],
          ]} keyWidth={80} />
        </Panel>
      </Grid>

      <Grid cols={3}>
        <Panel title="Obfuscation layers" right={`${OBFUSCATION_LAYERS.length} peeled`}>
          {OBFUSCATION_LAYERS.map((l, i) => (
            <div key={l} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 0" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#A8A29E" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 13, color: "#1C1917" }}>{l}</span>
            </div>
          ))}
        </Panel>
        <Panel title="C2 configuration">
          <KV rows={C2_CONFIG} keyWidth={110} />
        </Panel>
        <Panel title="Anti-analysis checks" right="5 methods">
          <KV rows={ANTI_ANALYSIS} keyWidth={110} />
        </Panel>
      </Grid>

      <Panel title="Indicators of compromise" right={`${findings.length} found`}>
        <IocTable findings={findings} showNotes />
      </Panel>

      <Panel title="Credential theft targets">
        <KV rows={TARGETED_APPS} keyWidth={110} />
      </Panel>
    </div>
  );
}

// ── Response plan ──────────────────────────────────────────────────

export function ResponseView({ ready }) {
  if (!ready) return <Panel><Empty>Response plan is generated once analysis completes</Empty></Panel>;
  const accents = ["#DC2626", "#D97706", "#16A34A"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Grid cols={3}>
        {REMEDIATION.map((r, i) => (
          <Panel key={r.tier} style={{ borderTop: `3px solid ${accents[i]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>{r.tier}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#A8A29E" }}>{r.owner}</span>
            </div>
            {r.items.map(item => (
              <div key={item} style={{ display: "flex", gap: 10, padding: "7px 0", borderTop: "1px solid #F5F5F4" }}>
                <span style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2, borderRadius: 4, border: "1.5px solid #D6D3D1" }} />
                <span style={{ fontSize: 13, lineHeight: 1.5, color: "#292524" }}>{item}</span>
              </div>
            ))}
          </Panel>
        ))}
      </Grid>

      <Panel title="Detection queries" right="Blue team">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
          {DETECTIONS.map(d => (
            <div key={d.name} style={{ background: "#1C1917", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{d.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 12.5, color: "#E7E5E4" }}>{d.query}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ── Architecture ───────────────────────────────────────────────────

function Node({ title, sub, dark, tags }) {
  return (
    <div style={{
      border: `1px solid ${dark ? "#1C1917" : "#E7E5E4"}`, borderRadius: 10, padding: "12px 14px",
      background: dark ? "#1C1917" : "#FFFFFF", color: dark ? "#FAFAF9" : "#1C1917",
    }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: dark ? "#A8A29E" : "#78716C", marginTop: 2 }}>{sub}</div>
      {tags && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
          {tags.map(t => (
            <span key={t} style={{
              fontFamily: MONO, fontSize: 10, padding: "2px 6px", borderRadius: 4,
              background: dark ? "#292524" : "#F5F5F4", color: dark ? "#D6D3D1" : "#57534E",
            }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function Arrow({ label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 4px", minWidth: 48 }}>
      {label && <span style={{ fontFamily: MONO, fontSize: 9.5, color: "#A8A29E", marginBottom: 3, whiteSpace: "nowrap" }}>{label}</span>}
      <svg width="40" height="10" viewBox="0 0 40 10"><path d="M0 5h36M32 1l4 4-4 4" stroke="#A8A29E" strokeWidth="1.5" fill="none" /></svg>
    </div>
  );
}

export function ArchitectureView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Panel title="System design">
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <div style={{ flex: 1 }}><Node title="Next.js dashboard" sub="React 19 · live agent view" tags={["upload", "poll", "chat"]} /></div>
          <Arrow label="REST" />
          <div style={{ flex: 1 }}><Node title="FastAPI" sub="Job queue + event stream" tags={["/analyze", "/status", "/report", "/chat"]} /></div>
          <Arrow label="spawn" />
          <div style={{ flex: 1.3 }}><Node dark title="Claude Agent SDK" sub="Orchestrated investigation (Sonnet)" tags={["multi-phase", "session resume", "event log"]} /></div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 0" }}>
          <div style={{ flex: 1.3, display: "flex", justifyContent: "center", fontFamily: MONO, fontSize: 9.5, color: "#A8A29E" }}>
            ↓ in-process MCP tools
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
          <Node title="sandbox" sub="bash inside an isolated Docker container" tags={["REstringer", "box-js", "YARA", "acorn"]} />
          <Node title="extract_file" sub="copy artifacts out of the container" tags={["docker cp"]} />
          <Node title="host_analyze" sub=".NET + PE tooling on host" tags={["ilspycmd", "pefile"]} />
        </div>

        <div style={{ display: "flex", alignItems: "stretch", marginTop: 20 }}>
          <div style={{ flex: 1 }}><Node title="Structured report" sub="IOCs · ATT&CK · remediation" /></div>
          <Arrow label="chunk + embed" />
          <div style={{ flex: 1 }}><Node title="Snowflake" sub="Findings store + Cortex similarity" tags={["vector search", "SQLite fallback"]} /></div>
          <Arrow label="top-k" />
          <div style={{ flex: 1 }}><Node dark title="Analyst chat (RAG)" sub="Claude answers grounded in findings" tags={["sources cited"]} /></div>
        </div>
      </Panel>

      <Grid cols={3}>
        <Panel title="Safety model">
          <div style={{ fontSize: 13, lineHeight: 1.65, color: "#44403C" }}>
            Fully static analysis. The sample is never executed — the agent only decodes, decrypts and decompiles it inside a disposable container.
          </div>
        </Panel>
        <Panel title="Reference run">
          <KV rows={[["Wall clock", RUN_METRICS.wallClock], ["Agent turns", String(RUN_METRICS.agentTurns)], ["API cost", RUN_METRICS.cost]]} keyWidth={100} />
        </Panel>
        <Panel title="Stack">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Next.js 16", "React 19", "FastAPI", "Claude Agent SDK", "MCP", "Docker", "Snowflake Cortex", "ILSpy", "YARA"].map(t => (
              <span key={t} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid #E7E5E4", color: "#44403C" }}>{t}</span>
            ))}
          </div>
        </Panel>
      </Grid>
    </div>
  );
}

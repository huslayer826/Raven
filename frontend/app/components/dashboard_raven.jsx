import { useState, useEffect, useRef } from "react";
import ChatPanel from "./ChatPanel";
import { RavenMark, RavenWordmark } from "./logo";
import {
  Panel, Label, MONO, KillChain, MitreMatrix, EvidenceView, ResponseView, ArchitectureView,
} from "./views";
import {
  DEMO_SAMPLE, DEMO_VERDICT, DEMO_IOCS, DEMO_SCRIPT, AGENT_ACTIVITY, MITRE,
} from "./demoData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// ── Agent hierarchy — orchestrator → sequential stages → parallel leaf agents
const AGENT_TREE = {
  id: "orchestrator", name: "Orchestrator", model: "System", desc: "Pipeline coordination",
  children: [
    { id: "static",        name: "Static analyst",     model: "Claude", desc: "Hashes · PE · Entropy",          children: [] },
    { id: "deobfuscation", name: "Deobfuscation",      model: "Claude", desc: "Layer recovery · Chain tracing", children: [] },
    { id: "scenario",      name: "Scenario builder",   model: "Claude", desc: "Behavioral projection",          children: [] },
    {
      id: "parallel", name: "Parallel analysis", model: "System", desc: "Four agents concurrent",
      children: [
        { id: "network",    name: "Network",     model: "Claude", desc: "C2 · DNS · Exfil",       children: [] },
        { id: "filesystem", name: "Filesystem",  model: "Claude", desc: "Drops · Payloads",       children: [] },
        { id: "registry",   name: "Registry",    model: "Claude", desc: "Persistence · Evasion",  children: [] },
        { id: "intel",      name: "Threat intel",model: "Claude", desc: "Capabilities · Attribution", children: [] },
      ],
    },
    { id: "critic",    name: "Adversarial critic", model: "Claude", desc: "FP reduction · Validation",   children: [] },
    { id: "reporter",  name: "Report writer",      model: "Claude", desc: "MITRE · Remediation",         children: [] },
    { id: "responder", name: "Response agents",    model: "System", desc: "IOC export · Alerts",         children: [] },
  ],
};

const ALL_AGENTS = (() => {
  const flat = [];
  const walk = (node) => { flat.push(node); node.children?.forEach(walk); };
  walk(AGENT_TREE);
  return flat;
})();

const PIPELINE_STEPS = [
  { id: 1, label: "Ingest",   desc: "Sample intake" },
  { id: 2, label: "Classify", desc: "File identification" },
  { id: 3, label: "Analyze",  desc: "Parallel analyzers" },
  { id: 4, label: "Reason",   desc: "Agent debate" },
  { id: 5, label: "Report",   desc: "Final synthesis" },
];

const TOOLS = [
  { name: "Hashing + metadata",  time: null },
  { name: "File identification", time: null },
  { name: "String extraction",   time: null },
  { name: "AST parsing",         time: null },
  { name: "Entropy profiler",    time: null },
  { name: "YARA signature scan", time: null },
  { name: "IOC extractor",       time: null },
  { name: "Hex inspector",       time: null },
];
const TOOL_TIMES = ["0.1s", "0.1s", "0.4s", "0.6s", "0.1s", "0.2s", "0.3s", "0.1s"];

const NAV_ITEMS = [
  { id: "overview",      label: "Overview",         section: "Command center" },
  { id: "evidence",      label: "Evidence",         section: "Static artifacts" },
  { id: "investigation", label: "AI investigation", section: "Agent reasoning" },
  { id: "response",      label: "Response plan",    section: "Containment + export" },
  { id: "architecture",  label: "Architecture",     section: "Platform blueprint" },
];

const AGENT_COLORS = {
  static: "#7C3AED", deobfuscation: "#7C3AED", scenario: "#7C3AED", critic: "#7C3AED", reporter: "#7C3AED",
  network: "#2563EB", filesystem: "#D97706", registry: "#059669", intel: "#DB2777",
};

// ── Tiny components ────────────────────────────────────────────────

function StatusDot({ status }) {
  const colors = { idle: "#D1D5DB", running: "#1C1917", complete: "#16A34A", error: "#DC2626" };
  return (
    <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: colors[status] || colors.idle }} />
      {status === "running" && (
        <div style={{
          position: "absolute", top: -3, left: -3, width: 16, height: 16,
          borderRadius: "50%", border: `2px solid ${colors.running}`,
          animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.4,
        }} />
      )}
    </div>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    critical: { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
    high:     { bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA" },
    medium:   { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
    info:     { bg: "#F0F9FF", color: "#075985", border: "#BAE6FD" },
  };
  const s = styles[severity] || styles.info;
  return (
    <span style={{
      fontSize: 10.5, fontFamily: MONO, fontWeight: 500,
      padding: "2px 8px", borderRadius: 4, backgroundColor: s.bg, color: s.color,
      border: `1px solid ${s.border}`, textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0,
    }}>{severity}</span>
  );
}

function RiskGauge({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? "#DC2626" : score >= 60 ? "#1C1917" : score >= 40 ? "#F59E0B" : "#16A34A";
  return (
    <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round" transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 600, fontFamily: MONO, color }}>{score}</div>
        <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, color: "#9CA3AF" }}>Risk score</div>
      </div>
    </div>
  );
}

function ModelTag({ model }) {
  const colors = { Claude: "#7C3AED", System: "#78716C" };
  return (
    <span style={{
      fontSize: 10, fontFamily: MONO, fontWeight: 500,
      color: colors[model] || "#78716C", textTransform: "uppercase", letterSpacing: "0.05em",
    }}>{model}</span>
  );
}

// Single agent card — shows name, status, live activity message
function AgentCard({ agent, statuses, activityMsgs }) {
  const status = statuses[agent.id] || "idle";
  const msg    = activityMsgs[agent.id] || null;
  const isParallelGroup = agent.id === "parallel";

  const borderColor = status === "running" ? "#A8A29E" : status === "complete" ? "#D1FAE5" : "#F5F5F4";
  const bgColor     = status === "running" ? "#F7F7F6" : status === "complete" ? "#F9FFF9" : "#FFFFFF";

  return (
    <div>
      <div style={{
        padding: "10px 12px", borderRadius: 9, border: `1px solid ${borderColor}`,
        background: bgColor, transition: "all 0.3s ease", position: "relative", overflow: "hidden",
      }}>
        {status === "running" && (
          <div style={{
            position: "absolute", top: 0, left: 0, width: "40%", height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(28,25,23,0.04), transparent)",
            animation: "scanline 2s linear infinite", pointerEvents: "none",
          }} />
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
            <StatusDot status={status} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1917", whiteSpace: "nowrap" }}>{agent.name}</span>
          </div>
          <ModelTag model={agent.model} />
        </div>

        {status === "running" && msg ? (
          <div style={{
            paddingLeft: 17, marginTop: 2, fontSize: 11, fontFamily: MONO,
            color: "#44403C", animation: "slideIn 0.25s ease",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            <span style={{ color: "#A8A29E", marginRight: 4 }}>›</span>{msg}
          </div>
        ) : status === "complete" ? (
          <div style={{ paddingLeft: 17, marginTop: 2, fontSize: 11, fontFamily: MONO, color: "#16A34A" }}>✓ Done</div>
        ) : (
          <div style={{ fontSize: 11, color: "#A8A29E", paddingLeft: 17 }}>{agent.desc}</div>
        )}
      </div>

      {agent.children?.length > 0 && (
        <div style={{ position: "relative", marginLeft: 20, marginTop: 4 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: isParallelGroup ? 0 : 18, width: 1, background: "#E7E5E4" }} />
          <div style={{
            display: "grid",
            gridTemplateColumns: isParallelGroup ? "repeat(2, minmax(0,1fr))" : "1fr",
            gap: isParallelGroup ? 6 : 4, paddingLeft: 12,
          }}>
            {agent.children.map((child, idx) => (
              <div key={child.id} style={{ position: "relative" }}>
                {(!isParallelGroup || idx % 2 === 0) && (
                  <div style={{ position: "absolute", left: -12, top: 18, width: 12, height: 1, background: "#E7E5E4" }} />
                )}
                <AgentCard agent={child} statuses={statuses} activityMsgs={activityMsgs} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const IOC_STYLES = {
  URL:  ["#FEF2F2", "#991B1B"], API: ["#FEF2F2", "#991B1B"],
  IP:   ["#FFF7ED", "#9A3412"], REG: ["#FFF7ED", "#9A3412"], FILE: ["#FFF7ED", "#9A3412"],
  HASH: ["#F0F9FF", "#075985"],
};

function IocTable({ findings, showNotes }) {
  if (findings.length === 0) {
    return <div style={{ color: "#D6D3D1", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No indicators extracted yet</div>;
  }
  return (
    <div>
      {findings.map((f, i) => {
        const [bg, color] = IOC_STYLES[f.type] || IOC_STYLES.HASH;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
            borderBottom: i < findings.length - 1 ? "1px solid #F5F5F4" : "none",
            animation: "fadeUp 0.3s ease",
          }}>
            <span style={{
              fontSize: 10, fontFamily: MONO, fontWeight: 600, padding: "2px 0",
              borderRadius: 4, width: 44, textAlign: "center", flexShrink: 0, background: bg, color,
            }}>{f.type}</span>
            <span style={{
              fontSize: 12.5, fontFamily: MONO, color: "#1C1917", flex: 1, minWidth: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{f.value}</span>
            {showNotes && f.note && (
              <span style={{ fontSize: 12, color: "#78716C", width: 230, flexShrink: 0 }}>{f.note}</span>
            )}
            {showNotes && <span style={{ fontSize: 11, color: "#A8A29E", width: 120, flexShrink: 0 }}>{f.agent}</span>}
            <span style={{ width: 76, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}><SeverityBadge severity={f.severity} /></span>
          </div>
        );
      })}
    </div>
  );
}

function AgentTrace({ agentLog, logRef, maxHeight }) {
  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 12,
      padding: "20px 24px 8px", display: "flex", flexDirection: "column", maxHeight,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
        <Label>Agent reasoning trace</Label>
        <span style={{ fontSize: 11, fontFamily: MONO, color: "#A8A29E" }}>{agentLog.length} events</span>
      </div>
      <div ref={logRef} style={{ overflow: "auto", minHeight: 0 }}>
      {agentLog.length === 0 ? (
        <div style={{ color: "#D6D3D1", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No activity yet</div>
      ) : (
        agentLog.map((entry, i) => (
          <div key={i} style={{
            display: "flex", gap: 10, padding: "8px 0",
            borderBottom: i < agentLog.length - 1 ? "1px solid #F5F5F4" : "none",
            animation: "slideIn 0.3s ease",
          }}>
            <span style={{ fontSize: 11, fontFamily: MONO, color: "#A8A29E", flexShrink: 0, marginTop: 1 }}>{entry.time}</span>
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, textTransform: "uppercase", fontFamily: MONO,
                color: AGENT_COLORS[entry.agent] || "#78716C",
              }}>{entry.agentName}</span>
              <p style={{ fontSize: 13, color: "#44403C", marginTop: 2, lineHeight: 1.5, overflowWrap: "anywhere" }}>{entry.text}</p>
            </div>
          </div>
        ))
      )}
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────

export default function MalwareScopeDashboard() {
  const [activeNav,      setActiveNav]      = useState("overview");
  const [fileName,       setFileName]       = useState(null);
  const [fileObj,        setFileObj]        = useState(null);
  const [analysisState,  setAnalysisState]  = useState("idle");
  const [demoMode,       setDemoMode]       = useState(false);
  const [currentStep,    setCurrentStep]    = useState(0);
  const [agentStatuses,  setAgentStatuses]  = useState({});
  const [activityMsgs,   setActivityMsgs]   = useState({});
  const [tools,          setTools]          = useState(TOOLS);
  const [findings,       setFindings]       = useState([]);
  const [riskScore,      setRiskScore]      = useState(0);
  const [classification, setClassification] = useState(null);
  const [summary,        setSummary]        = useState("");
  const [agentLog,       setAgentLog]       = useState([]);
  const [elapsed,        setElapsed]        = useState(0);
  const [jobId,          setJobId]          = useState(null);
  const fileInputRef  = useRef(null);
  const timerRef      = useRef(null);
  const activityRefs  = useRef({});
  const demoTimers    = useRef([]);
  const eventCursor   = useRef(0);
  const agentLogRef   = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (file) { setFileName(file.name); setFileObj(file); setDemoMode(false); }
  };

  const startActivityCycle = (agentId) => {
    const msgs = AGENT_ACTIVITY[agentId];
    if (!msgs?.length) return;
    let i = 0;
    clearInterval(activityRefs.current[agentId]);
    setActivityMsgs(prev => ({ ...prev, [agentId]: msgs[0] }));
    activityRefs.current[agentId] = setInterval(() => {
      i = (i + 1) % msgs.length;
      setActivityMsgs(prev => ({ ...prev, [agentId]: msgs[i] }));
    }, 1800);
  };

  const stopActivityCycle = (agentId) => {
    clearInterval(activityRefs.current[agentId]);
    setActivityMsgs(prev => ({ ...prev, [agentId]: null }));
  };

  const setAgent = (id, status, { animate = true } = {}) => {
    setAgentStatuses(prev => ({ ...prev, [id]: status }));
    if (status === "running" && animate) startActivityCycle(id);
    if (status === "complete" || status === "error") stopActivityCycle(id);
  };

  const addLog = (agentId, text, at = new Date()) => {
    setAgentLog(prev => [...prev, {
      time: at.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      agent: agentId,
      agentName: ALL_AGENTS.find(a => a.id === agentId)?.name || agentId,
      text,
    }]);
  };

  const resetRun = () => {
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
    Object.values(activityRefs.current).forEach(clearInterval);
    clearInterval(timerRef.current);
    setCurrentStep(0); setElapsed(0); setAgentLog([]); setFindings([]);
    setRiskScore(0); setClassification(null); setSummary("");
    setAgentStatuses({}); setActivityMsgs({}); setTools(TOOLS); setJobId(null);
    eventCursor.current = 0;
  };

  // ── Demo replay of the recorded run ──
  const runDemo = ({ instant = false } = {}) => {
    resetRun();
    setDemoMode(true);
    setFileName(DEMO_SAMPLE.name);
    setFileObj(null);
    setAnalysisState("running");
    const start = Date.now();
    if (!instant) timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 250);

    const apply = (s) => {
      if (s.agent) setAgent(s.agent[0], s.agent[1], { animate: !instant });
      if (s.step) setCurrentStep(s.step);
      if (s.tool !== undefined) setTools(p => p.map((tool, i) => i === s.tool ? { ...tool, time: TOOL_TIMES[i] } : tool));
      if (s.log) addLog(s.log[0], s.log[1], new Date(start + s.t * 1000));
      if (s.ioc !== undefined) setFindings(p => [...p, DEMO_IOCS[s.ioc]]);
      if (s.done) {
        clearInterval(timerRef.current);
        setElapsed(Math.round(s.t));
        setClassification(DEMO_VERDICT.classification);
        setSummary(DEMO_VERDICT.summary);
        setRiskScore(DEMO_VERDICT.riskScore);
        setJobId("demo");
        setAnalysisState("complete");
      }
    };

    const script = [...DEMO_SCRIPT].sort((a, b) => a.t - b.t);
    if (instant) script.forEach(apply);
    else demoTimers.current = script.map(s => setTimeout(() => apply(s), s.t * 1000));
  };

  // ── Live backend run ──
  const runAnalysis = async () => {
    if (!fileName) return;
    if (demoMode || !fileObj) return runDemo();

    resetRun();
    setAnalysisState("running");
    setCurrentStep(1);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    setAgent("orchestrator", "running");
    addLog("orchestrator", "Pipeline initialised. Submitting to backend.");

    try {
      const formData = new FormData();
      formData.append("file", fileObj, fileName);
      const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: formData });
      const { job_id } = await res.json();
      setJobId(job_id);

      setAgent("static", "running");
      setCurrentStep(2);
      addLog("static", "Pipeline started. Triage running...");

      let phase = 0;

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/status/${job_id}?after=${eventCursor.current}`);
          const status = await statusRes.json();

          if (status.events?.length > 0) {
            for (const evt of status.events) {
              if (evt.type === "triage_start") {
                setAgent("static", "running");
                setCurrentStep(2);
                addLog("static", "Triage started — hashing, AST, structure scan.");
              } else if (evt.type === "triage_done") {
                setAgent("static", "complete");
                setCurrentStep(3);
                setTools(p => p.map((tool, i) => ({ ...tool, time: TOOL_TIMES[i] })));
                addLog("static", "Triage complete. Hashes, strings, AST extracted.");
              } else if (evt.type === "investigation_start") {
                setAgent("deobfuscation", "running");
                addLog("orchestrator", "Investigation phase started.");
              } else if (evt.type === "tool_call") {
                const tool = evt.tool || "";
                if (tool.includes("sandbox")) {
                  if (phase < 2) { phase = 2; setAgent("deobfuscation", "running"); }
                  addLog("deobfuscation", `sandbox: ${evt.preview}`);
                } else if (tool.includes("extract_file")) {
                  if (phase < 4) {
                    phase = 4;
                    setAgent("deobfuscation", "complete");
                    setAgent("scenario", "complete");
                    setAgent("parallel", "running");
                    setAgent("network", "running");
                    setAgent("filesystem", "running");
                    setCurrentStep(4);
                  }
                  addLog("filesystem", `extract: ${evt.preview}`);
                } else if (tool.includes("host_analyze")) {
                  if (phase < 4) {
                    phase = 4;
                    setAgent("parallel", "running");
                    setAgent("registry", "running");
                    setAgent("intel", "running");
                    setCurrentStep(4);
                  }
                  addLog("intel", `host: ${evt.preview}`);
                } else {
                  addLog("deobfuscation", `${tool}: ${evt.preview}`);
                }
              } else if (evt.type === "tool_result") {
                addLog("deobfuscation", `[${evt.status}] ${evt.preview}`);
              } else if (evt.type === "text") {
                const preview = (evt.preview || "").toLowerCase();
                if (preview.includes("decrypt") || preview.includes("aes") || preview.includes("powershell")) {
                  if (phase < 3) { phase = 3; setAgent("scenario", "running"); }
                  addLog("scenario", evt.preview);
                } else if (preview.includes("pe ") || preview.includes(".net") || preview.includes("decompil")) {
                  addLog("intel", evt.preview);
                } else {
                  addLog("deobfuscation", evt.preview);
                }
              } else if (evt.type === "thinking") {
                addLog("critic", evt.preview);
              } else if (evt.type === "phase_complete") {
                addLog("orchestrator", `Phase ${evt.phase} complete — ${evt.turns} turns, $${evt.cost}`);
                if (String(evt.phase) === "2") {
                  ["deobfuscation", "scenario", "parallel", "network", "filesystem", "registry", "intel"].forEach(id => setAgent(id, "complete"));
                  setAgent("critic", "running");
                  setCurrentStep(5);
                }
                if (String(evt.phase) === "3") {
                  setAgent("critic", "complete");
                  setAgent("reporter", "running");
                }
              } else if (evt.type === "phase_start" && String(evt.phase) === "3") {
                setAgent("critic", "running");
                addLog("orchestrator", "Phase 3: deeper analysis resume.");
              }
            }
            eventCursor.current = status.event_count;
          }

          if (status.status === "complete") {
            clearInterval(pollInterval);
            const reportData = await (await fetch(`${API_BASE}/report/${job_id}`)).json();
            ALL_AGENTS.forEach(a => setAgent(a.id, "complete"));

            const report = reportData.report || {};
            const iocs = report.iocs || {};
            const newFindings = [];
            (iocs.ips || []).forEach(ip => newFindings.push({ type: "IP", value: ip, severity: "critical", agent: "Network" }));
            (iocs.domains || []).forEach(d => newFindings.push({ type: "URL", value: d, severity: "high", agent: "Network" }));
            (iocs.files || []).forEach(f => newFindings.push({ type: "FILE", value: f, severity: "high", agent: "Filesystem" }));
            (iocs.hashes || []).forEach(h => newFindings.push({ type: "HASH", value: h.substring(0, 16) + "…", severity: "info", agent: "Static analyst" }));
            setFindings(newFindings);

            setClassification(report.malware_family || report.malware_type || "Unknown");
            setSummary((report.executive_summary || "").slice(0, 260));
            setRiskScore(report.severity === "critical" ? 92 : report.severity === "high" ? 70 : 45);
            setCurrentStep(6);
            addLog("reporter", "Report complete.");
            setAnalysisState("complete");
            clearInterval(timerRef.current);
          } else if (status.status === "error") {
            clearInterval(pollInterval);
            addLog("orchestrator", `Error: ${status.error || "Unknown error"}`);
            setAgent("orchestrator", "error");
            setAnalysisState("idle");
            clearInterval(timerRef.current);
          }
        } catch (err) {
          console.warn("Poll error:", err);
        }
      }, 3000);
    } catch (err) {
      addLog("orchestrator", `Backend not reachable at ${API_BASE} — try the recorded demo instead.`);
      setAgent("orchestrator", "error");
      setAnalysisState("idle");
      clearInterval(timerRef.current);
    }
  };

  // ?demo=1 plays the replay, ?demo=done jumps to the finished state, ?view=<tab> opens a tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (NAV_ITEMS.some(n => n.id === view)) setActiveNav(view);
    const demo = params.get("demo");
    if (demo) runDemo({ instant: demo === "done" });
    return () => {
      clearInterval(timerRef.current);
      demoTimers.current.forEach(clearTimeout);
      Object.values(activityRefs.current).forEach(clearInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (agentLogRef.current) agentLogRef.current.scrollTop = agentLogRef.current.scrollHeight;
  }, [agentLog]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const isDone = analysisState === "complete";
  const doneCount = Object.values(agentStatuses).filter(s => s === "complete").length;
  const activeItem = NAV_ITEMS.find(n => n.id === activeNav);

  const headings = {
    overview: isDone ? "Analysis complete" : analysisState === "running" ? "Analyzing threat…" : "Threat analysis",
    evidence: "Evidence",
    investigation: "AI investigation",
    response: "Response plan",
    architecture: "Architecture",
  };
  const subtitles = {
    overview: "A multi-agent Claude pipeline that deobfuscates, decrypts and decompiles malware in an isolated sandbox — producing explainable findings, ATT&CK mappings and remediation guidance.",
    evidence: "Static artifacts recovered from the sample: hashes, decrypted payloads, C2 configuration and indicators.",
    investigation: "How the agents reasoned through seven layers of obfuscation to the final payload.",
    response: "Prioritised containment, hunting and hardening steps generated from the findings.",
    architecture: "How Raven is built — from upload to agent sandbox to grounded analyst chat.",
  };

  // ── Overview sections ──
  const uploadZone = (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleFileDrop}
      onDragOver={e => e.preventDefault()}
      style={{
        border: fileName ? "1px solid #E7E5E4" : "2px dashed #D6D3D1",
        borderRadius: 12, padding: "18px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, cursor: "pointer", background: "#FFFFFF", transition: "all 0.2s",
      }}
    >
      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileDrop} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: fileName ? "#1C1917" : "#F5F5F4",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: fileName ? "#fff" : "#A8A29E",
        }}>{fileName ? <RavenMark width={18} height={12} /> : "↑"}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#1C1917", fontFamily: fileName ? MONO : undefined }}>
            {fileName || "Drop a malware sample"}
          </div>
          <div style={{ fontSize: 12, color: "#A8A29E" }}>
            {demoMode ? `${DEMO_SAMPLE.size} · ${DEMO_SAMPLE.type} · SHA-256 ${DEMO_SAMPLE.sha256.slice(0, 12)}…`
              : "PE, DLL, script, document, archive — analysed statically, never executed"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {!fileName && (
          <button onClick={e => { e.stopPropagation(); runDemo(); }} style={{
            padding: "9px 16px", fontSize: 13, fontWeight: 500, background: "#FFFFFF",
            border: "1px solid #D6D3D1", borderRadius: 8, color: "#1C1917", cursor: "pointer",
          }}>Replay recorded analysis</button>
        )}
        {fileName && analysisState === "idle" && (
          <button style={{
            padding: "4px 10px", fontSize: 12, background: "transparent",
            border: "1px solid #D6D3D1", borderRadius: 6, color: "#78716C", cursor: "pointer",
          }} onClick={e => { e.stopPropagation(); setFileName(null); setFileObj(null); setDemoMode(false); }}>Clear</button>
        )}
        <button onClick={e => { e.stopPropagation(); if (fileName) runAnalysis(); }}
          disabled={!fileName || analysisState === "running"}
          style={{
            padding: "9px 20px", fontSize: 13, fontWeight: 600,
            background: fileName ? "#1C1917" : "#E7E5E4", color: fileName ? "#fff" : "#A8A29E",
            border: "none", borderRadius: 8, cursor: fileName ? "pointer" : "default",
            transition: "all 0.15s", opacity: analysisState === "running" ? 0.5 : 1,
          }}>
          {analysisState === "running" ? "Analyzing…" : isDone ? "Re-run" : "Run analysis"}
        </button>
      </div>
    </div>
  );

  const pipeline = (
    <Panel title="Analysis pipeline" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = currentStep === step.id;
          const isStepDone = currentStep > step.id;
          return (
            <div key={step.id} style={{ flex: i < PIPELINE_STEPS.length - 1 ? 1 : "0 0 auto", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: MONO, fontSize: 14, fontWeight: 600,
                  background: isStepDone ? "#16A34A" : isActive ? "#1C1917" : "#F5F5F4",
                  color: isStepDone || isActive ? "#fff" : "#A8A29E",
                  transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)", position: "relative", overflow: "hidden",
                }}>
                  {isStepDone ? "✓" : String(step.id).padStart(2, "0")}
                  {isActive && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, width: "50%", height: "100%",
                      background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)",
                      animation: "scanline 1.5s linear infinite",
                    }} />
                  )}
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, margin: "0 8px", background: isStepDone ? "#16A34A" : "#E7E5E4", transition: "background 0.4s" }} />
                )}
              </div>
              <div style={{ marginTop: 8, paddingRight: 12 }}>
                <div style={{ fontSize: 13, fontWeight: isActive || isStepDone ? 600 : 400, color: isActive || isStepDone ? "#1C1917" : "#A8A29E" }}>{step.label}</div>
                <div style={{ fontSize: 11, color: "#A8A29E" }}>{isStepDone ? "Complete" : isActive ? "Running" : step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  const hierarchy = (
    <Panel title="Agent hierarchy" right={`${doneCount} / ${ALL_AGENTS.length} done`}>
      <AgentCard agent={AGENT_TREE} statuses={agentStatuses} activityMsgs={activityMsgs} />
    </Panel>
  );

  const sampleOverview = (
    <Panel title="Verdict" right={classification && <SeverityBadge severity="critical" />} style={{ display: "flex", flexDirection: "column" }}>
      {classification ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <RiskGauge score={riskScore} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 8 }}>{classification}</div>
              <div style={{ fontSize: 13, color: "#78716C", lineHeight: 1.6 }}>{summary}</div>
            </div>
          </div>
          {demoMode && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", borderTop: "1px solid #F5F5F4", paddingTop: 16 }}>
              {DEMO_VERDICT.stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: MONO, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#A8A29E" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          {demoMode && (
            <div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginBottom: 8 }}>Top ATT&CK techniques</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["T1562.001", "T1620", "T1027.013", "T1036.008", "T1056.001", "T1071.002"].map(t => (
                  <span key={t} style={{
                    fontSize: 11, fontFamily: MONO, padding: "3px 8px", borderRadius: 4,
                    background: "#F0F0EE", color: "#1C1917", fontWeight: 500,
                  }}>{t}</span>
                ))}
                <button onClick={() => setActiveNav("investigation")} style={{
                  fontSize: 11, fontFamily: MONO, padding: "3px 8px", borderRadius: 4, cursor: "pointer",
                  background: "transparent", border: "1px dashed #D6D3D1", color: "#78716C",
                }}>+{MITRE.length - 6} more</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        analysisState === "running" && agentLog.length > 0 ? (
          <div style={{ minHeight: 200 }}>
            <div style={{ fontSize: 12, color: "#A8A29E", marginBottom: 10 }}>Agents are investigating — latest findings</div>
            {agentLog.slice(-4).map((entry, i, arr) => (
              <div key={agentLog.length - arr.length + i} style={{
                padding: "8px 0", borderTop: i ? "1px solid #F5F5F4" : "none",
                animation: "slideIn 0.3s ease", opacity: 0.55 + (0.45 * (i + 1)) / arr.length,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", fontFamily: MONO, color: AGENT_COLORS[entry.agent] || "#78716C" }}>
                  {entry.agentName}
                </span>
                <div style={{ fontSize: 13, color: "#44403C", lineHeight: 1.5, marginTop: 2 }}>{entry.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#D6D3D1", fontSize: 13 }}>
            {analysisState === "running" ? "Agents are investigating…" : "Awaiting sample"}
          </div>
        )
      )}
    </Panel>
  );

  const iocPanel = (
    <Panel title="Indicators of compromise" right={`${findings.length} found`} style={{ maxHeight: 560, overflow: "auto" }}>
      <IocTable findings={findings} />
    </Panel>
  );

  const views = {
    overview: (
      <>
        {uploadZone}
        {pipeline}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 20, marginBottom: 24, alignItems: "start" }}>
          {hierarchy}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {sampleOverview}
            {iocPanel}
          </div>
        </div>
        <AgentTrace agentLog={agentLog} logRef={agentLogRef} maxHeight={420} />
      </>
    ),
    evidence: <EvidenceView ready={isDone} findings={findings} IocTable={IocTable} />,
    investigation: (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Panel title="Reconstructed kill chain">
          {isDone ? <KillChain /> : <div style={{ color: "#D6D3D1", fontSize: 13, padding: "24px 0", textAlign: "center" }}>Kill chain appears once the agents finish</div>}
        </Panel>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)", gap: 20, alignItems: "start" }}>
          {hierarchy}
          <AgentTrace agentLog={agentLog} logRef={agentLogRef} maxHeight={640} />
        </div>
        {isDone && (
          <Panel title="MITRE ATT&CK coverage" right={`${MITRE.length} techniques`}>
            <MitreMatrix />
          </Panel>
        )}
      </div>
    ),
    response: <ResponseView ready={isDone} />,
    architecture: <ArchitectureView />,
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100vh", background: "#FAFAF9", color: "#1C1917" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @keyframes ping    { 75%,100% { transform: scale(2); opacity: 0; } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scanline { from { transform: translateX(-100%); } to { transform: translateX(400%); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #D6D3D1; border-radius: 2px; }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: 56, borderBottom: "1px solid #E7E5E4",
        background: "#FFFFFF", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1C1917", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RavenMark />
          </div>
          <RavenWordmark />
          <div style={{ fontSize: 12, color: "#A8A29E", borderLeft: "1px solid #E7E5E4", paddingLeft: 12 }}>AI-native threat analysis</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {demoMode && (
            <span style={{
              fontSize: 11, fontFamily: MONO, color: "#78716C", padding: "4px 10px",
              borderRadius: 999, border: "1px solid #E7E5E4", background: "#FAFAF9",
            }}>Recorded run · replay</span>
          )}
          {(analysisState === "running" || isDone) && (
            <div style={{ fontSize: 13, fontWeight: 500, fontFamily: MONO, display: "flex", alignItems: "center", gap: 8 }}>
              <StatusDot status={isDone ? "complete" : "running"} />
              {formatTime(elapsed)}
            </div>
          )}
          {isDone && (
            <a href="/report.md" download="raven_report.md" style={{
              padding: "7px 16px", fontSize: 13, fontWeight: 500, textDecoration: "none",
              background: "#1C1917", color: "#fff", borderRadius: 6,
            }}>Export report</a>
          )}
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220, borderRight: "1px solid #E7E5E4", background: "#FFFFFF",
          flexShrink: 0,
        }}>
          <div style={{
            position: "sticky", top: 56, height: "calc(100vh - 56px)", overflow: "auto",
            padding: "24px 16px", display: "flex", flexDirection: "column",
          }}>
          <div style={{ marginBottom: 12, paddingLeft: 12 }}><Label>Investigation view</Label></div>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)} style={{
              display: "block", width: "100%", padding: "9px 12px", marginBottom: 2,
              textAlign: "left", border: "none", borderRadius: 8, cursor: "pointer",
              background: activeNav === item.id ? "#F0F0EE" : "transparent", transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 14, fontWeight: activeNav === item.id ? 600 : 400, color: activeNav === item.id ? "#1C1917" : "#44403C" }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 1 }}>{item.section}</div>
            </button>
          ))}

          <div style={{ marginTop: 28, marginBottom: 10, paddingLeft: 12 }}><Label>Analysis tools</Label></div>
          {tools.map((tool, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 12px", marginBottom: 1, borderRadius: 8,
              background: tool.time ? "#F5F5F4" : "transparent",
              animation: tool.time ? "fadeUp 0.3s ease" : "none",
            }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#44403C" }}>{tool.name}</div>
              {tool.time ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: "#A8A29E" }}>{tool.time}</span>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                </div>
              ) : (
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E7E5E4" }} />
              )}
            </div>
          ))}
          <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", justifyContent: "center" }}>
            <RavenMark width={48} height={30} fill="#1C1917" style={{ opacity: 0.07 }} />
          </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, minWidth: 0, padding: "28px 32px 48px" }}>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "#1C1917", fontWeight: 500 }}>Raven</span>
            <span style={{ color: "#D6D3D1" }}>/</span>
            <span style={{ color: "#78716C" }}>{activeItem.label}</span>
            {fileName && <>
              <span style={{ color: "#D6D3D1" }}>/</span>
              <span style={{ color: "#A8A29E", fontFamily: MONO, fontSize: 12 }}>{fileName}</span>
            </>}
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 8 }}>
            {headings[activeNav]}
          </h1>
          <p style={{ fontSize: 14, color: "#78716C", marginBottom: 28, maxWidth: 640, lineHeight: 1.6 }}>
            {subtitles[activeNav]}
          </p>

          <div key={activeNav} style={{ animation: "fadeUp 0.25s ease" }}>
            {views[activeNav]}
          </div>
        </main>
      </div>

      <ChatPanel jobId={jobId} isDone={isDone} demo={demoMode} />
    </div>
  );
}

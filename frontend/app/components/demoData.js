// Demo replay data — taken from the real analysis run on 6108674530.JS.malicious
// (workspace/pipeline_events.jsonl + malware_analysis_report.md). Lets the dashboard
// run end-to-end without the backend, Docker sandbox, or Snowflake.

export const DEMO_SAMPLE = {
  name: "6108674530.JS.malicious",
  size: "4.0 MB",
  type: "JScript (WSH) — obfuscated",
  md5: "dc4d09338705ab4709c14fea1c51ece4",
  sha1: "e9cd236b3d15ef6c968e74324be196462648fe8c",
  sha256: "3c19468cfd8dd509b03a06bb93203f7fb611cf83fcf1355ced78378c4a2285c1",
  tlsh: "T1F8160B90F684869438232E71A76470D1A9C651DF6FCAB512F01F6AB2FAF71C1E931336",
};

export const DEMO_PAYLOAD = {
  name: "Vile.png → .NET RAT (decrypted)",
  md5: "14ccb699d31447e92e5c31067e90855d",
  sha256: "6bc509f7a2c8389324a7b45b26844cde9be2fc4c9092d969b65be634660b0174",
};

export const DEMO_VERDICT = {
  classification: "Multi-stage dropper → .NET infostealer",
  severity: "critical",
  riskScore: 92,
  summary:
    "Obfuscated JScript drops two AES-encrypted fake PNGs, launches hidden PowerShell, patches AMSI to blind Defender, then reflectively loads a .NET RAT that steals credentials and exfiltrates over FTP.",
  stats: [
    { label: "Stages", value: "4" },
    { label: "Obfuscation layers", value: "7" },
    { label: "ATT&CK techniques", value: "26" },
    { label: "Apps targeted", value: "20+" },
  ],
};

// Real metrics from the recorded run
export const RUN_METRICS = { wallClock: "7m 38s", agentTurns: 36, cost: "$1.29" };

export const OBFUSCATION_LAYERS = [
  "javascript-obfuscator _0x string array (231 entries)",
  "String-array rotation",
  "CP437 dead-code blocks",
  "Unicode padding (1,649 lines)",
  "%%% noise padding",
  "10-delimiter split chain",
  "IMLRHNEGA marker stripping",
];

export const KILL_CHAIN = [
  { stage: "01", title: "JScript dropper", detail: "4 MB WSH script, 7 obfuscation layers. Writes Mands.png + Vile.png to C:\\Users\\Public\\", tech: "T1059.007" },
  { stage: "02", title: "PowerShell loader", detail: "Hidden window (-nop -c). AES-256-CBC decrypts both fake PNGs with a hardcoded key", tech: "T1059.001" },
  { stage: "03", title: "AMSI / ETW bypass", detail: "Patches AmsiScanBuffer in memory via VirtualProtect — Defender script scanning goes blind", tech: "T1562.001" },
  { stage: "04", title: ".NET RAT (fileless)", detail: "[Reflection.Assembly]::Load() — keylogger, clipboard, screenshots, credential theft, FTP exfil", tech: "T1620" },
];

// IOCs are shown defanged
export const DEMO_IOCS = [
  { type: "IP",   value: "91.204.209[.]32",                        severity: "critical", agent: "Network monitor",    note: "FTP C2 server" },
  { type: "URL",  value: "ftp://ftp.hhautoinvestment.co[.]tz",       severity: "critical", agent: "Network monitor",    note: "Exfiltration endpoint" },
  { type: "URL",  value: "hxxp://ip-api[.]com/line/?fields=hosting", severity: "high",     agent: "Network monitor",    note: "Anti-sandbox hosting check" },
  { type: "FILE", value: "C:\\Users\\Public\\Vile.png",              severity: "critical", agent: "Filesystem monitor", note: "AES-encrypted .NET RAT" },
  { type: "FILE", value: "C:\\Users\\Public\\Mands.png",             severity: "high",     agent: "Filesystem monitor", note: "AES-encrypted AMSI bypass" },
  { type: "FILE", value: "%APPDATA%\\eXCXES\\eXCXES.exe",            severity: "high",     agent: "Filesystem monitor", note: "Persistence binary" },
  { type: "REG",  value: "HKCU\\…\\CurrentVersion\\Run\\eXCXES",     severity: "high",     agent: "Registry monitor",   note: "Run-key persistence (disabled in config)" },
  { type: "API",  value: "VirtualProtect → amsi.dll",               severity: "critical", agent: "Registry monitor",   note: "AMSI memory patch" },
  { type: "API",  value: "SetWindowsHookEx(WH_KEYBOARD_LL)",          severity: "critical", agent: "Threat intel",       note: "Keylogger hook" },
  { type: "HASH", value: "3c19468cfd8dd509…a2285c1",                severity: "info",     agent: "Static analyst",     note: "SHA-256 · JS dropper" },
  { type: "HASH", value: "6bc509f7a2c83893…660b0174",               severity: "info",     agent: "Static analyst",     note: "SHA-256 · .NET RAT" },
];

export const C2_CONFIG = [
  ["Protocol", "FTP"],
  ["Host", "ftp.hhautoinvestment.co[.]tz"],
  ["IP", "91.204.209[.]32"],
  ["Account", "cmo@hhautoinvestment.co[.]tz"],
  ["User-Agent", "Firefox/99.0 (hardcoded)"],
  ["Mutex / persistence", "eXCXES"],
];

export const ANTI_ANALYSIS = [
  ["Debugger", "CheckRemoteDebuggerPresent()"],
  ["Hosting IP", "ip-api.com hosting=true → exit"],
  ["Sleep skew", "Thread.Sleep(10) timing check"],
  ["Sandbox DLLs", "Sandboxie, Avast, Comodo, 360"],
  ["Virtual machine", "WMI: Hyper-V, VMware, VirtualBox"],
];

export const TARGETED_APPS = [
  ["Browsers", "Chrome, Edge, Brave, Opera, Vivaldi, Firefox"],
  ["Email", "Outlook 11–16, Thunderbird, Becky!"],
  ["FTP", "FileZilla, WS_FTP, FTP Commander, FTPGetter"],
  ["VPN", "NordVPN, OpenVPN, Private Internet Access"],
  ["Chat", "Discord tokens, Pidgin, Paltalk, Trillian"],
];

export const MITRE = [
  { id: "T1059.007", name: "JavaScript",                      tactic: "Execution" },
  { id: "T1059.001", name: "PowerShell",                      tactic: "Execution" },
  { id: "T1059.003", name: "Windows Command Shell",           tactic: "Execution" },
  { id: "T1106",     name: "Native API",                      tactic: "Execution" },
  { id: "T1547.001", name: "Registry Run Keys",               tactic: "Persistence" },
  { id: "T1055",     name: "Process Injection",               tactic: "Privilege Escalation" },
  { id: "T1027.001", name: "Binary Padding",                  tactic: "Defense Evasion" },
  { id: "T1027.009", name: "Embedded Payloads",               tactic: "Defense Evasion" },
  { id: "T1027.013", name: "Encrypted/Encoded File",          tactic: "Defense Evasion" },
  { id: "T1036.008", name: "Masquerade File Type",            tactic: "Defense Evasion" },
  { id: "T1140",     name: "Deobfuscate/Decode Files",        tactic: "Defense Evasion" },
  { id: "T1562.001", name: "Disable or Modify Tools",         tactic: "Defense Evasion" },
  { id: "T1564.003", name: "Hidden Window",                   tactic: "Defense Evasion" },
  { id: "T1620",     name: "Reflective Code Loading",         tactic: "Defense Evasion" },
  { id: "T1497.001", name: "Sandbox Evasion: System Checks",  tactic: "Defense Evasion" },
  { id: "T1497.003", name: "Sandbox Evasion: Time Based",     tactic: "Defense Evasion" },
  { id: "T1555",     name: "Credentials from Password Stores",tactic: "Credential Access" },
  { id: "T1555.003", name: "Credentials from Web Browsers",   tactic: "Credential Access" },
  { id: "T1056.001", name: "Keylogging",                      tactic: "Credential Access" },
  { id: "T1082",     name: "System Information Discovery",    tactic: "Discovery" },
  { id: "T1518.001", name: "Security Software Discovery",     tactic: "Discovery" },
  { id: "T1074.001", name: "Local Data Staging",              tactic: "Collection" },
  { id: "T1115",     name: "Clipboard Data",                  tactic: "Collection" },
  { id: "T1113",     name: "Screen Capture",                  tactic: "Collection" },
  { id: "T1071.002", name: "File Transfer Protocols",         tactic: "Command and Control" },
  { id: "T1573.001", name: "Symmetric Cryptography",          tactic: "Command and Control" },
];

export const REMEDIATION = [
  {
    tier: "Immediate", owner: "SOC · now",
    items: [
      "Block 91.204.209[.]32 and sinkhole hhautoinvestment.co[.]tz",
      "Block outbound FTP (21) from endpoints — nothing should FTP from powershell.exe",
      "Sweep endpoints for C:\\Users\\Public\\{Mands,Vile}.png and %APPDATA%\\eXCXES\\",
      "SIEM alert: wscript.exe → powershell.exe -Noexit -nop",
      "Blocklist dropper SHA-256 3c19468c…a2285c1",
    ],
  },
  {
    tier: "Short-term", owner: "IR team · 24h",
    items: [
      "Enable PowerShell ScriptBlock + Module logging",
      "Sysmon: EID 1, 7 (amsi.dll), 11 (C:\\Users\\Public), 13 (eXCXES)",
      "Deploy an AMSI canary to detect in-memory patching",
      "If files found: rotate browser, Outlook, VPN, FTP creds; revoke Discord tokens",
    ],
  },
  {
    tier: "Long-term", owner: "Security eng · 1 week",
    items: [
      "Restrict wscript/cscript via AppLocker or WDAC",
      "PowerShell Constrained Language Mode on standard endpoints",
      "Sigma rules for the full JS → PS → AMSI → reflective-load chain",
      "Share IOCs with ISAC; submit hashes to MalwareBazaar",
    ],
  },
];

export const DETECTIONS = [
  { name: "AMSI patch", query: "VirtualProtect targeting amsi.dll memory regions" },
  { name: "Fileless .NET", query: "[Reflection.Assembly]::Load() from byte array in ScriptBlock logs" },
  { name: "FTP exfil", query: "powershell.exe → tcp/21 → 91.204.209.32" },
  { name: "Fake images", query: "*.png in C:\\Users\\Public without 89 50 4E 47 magic" },
];

// ── Replay script ──────────────────────────────────────────────────
// Each step fires at `t` seconds. Actions: agent status, pipeline step, tool, log, ioc.
// Log text is condensed from the agent's real reasoning trace.
export const DEMO_SCRIPT = [
  { t: 0.0,  agent: ["orchestrator", "running"], step: 1, log: ["orchestrator", "Sample received — 6108674530.JS.malicious (4,183,709 bytes). Spinning up sandbox."] },
  { t: 1.2,  agent: ["static", "running"], step: 2, log: ["static", "Triage: hashing, magic bytes, string extraction, AST parse."] },
  { t: 1.8,  tool: 0 }, { t: 2.3, tool: 1 }, { t: 2.9, tool: 2 }, { t: 3.4, tool: 3 },
  { t: 3.9,  tool: 4 }, { t: 4.4, tool: 5 }, { t: 4.9, tool: 6 }, { t: 5.3, tool: 7 },
  { t: 3.0,  log: ["static", "SHA-256 3c19468c…a2285c1 · no hits on public threat-intel platforms."] },
  { t: 4.6,  ioc: 9 },
  { t: 5.6,  agent: ["static", "complete"], step: 3, log: ["static", "WSH JScript, 1,651 lines. High-entropy string literals — heavily obfuscated."] },
  { t: 6.0,  agent: ["deobfuscation", "running"], log: ["deobfuscation", "javascript-obfuscator detected. Resolving 231-entry string array with REstringer."] },
  { t: 8.2,  log: ["deobfuscation", "Line 1782 holds a 185,944-char base64 blob passed to kittul.Run()."] },
  { t: 10.4, log: ["deobfuscation", "First decode is garbled. Script calls .Replace('IMLRHNEGA','') before decoding — stripping 14,607 markers."] },
  { t: 12.6, log: ["deobfuscation", "Layer 2: 104,592-byte random-looking blob. Not a PE — encrypted. Key must be in the JS."] },
  { t: 14.6, log: ["deobfuscation", "Recovered AES-256-CBC key + IV. Stage 2 PowerShell decoded (5,263 chars)."] },
  { t: 15.4, agent: ["deobfuscation", "complete"] },
  { t: 15.6, agent: ["scenario", "running"], log: ["scenario", "Projecting behaviour: dropper writes Mands.png + Vile.png to C:\\Users\\Public\\."] },
  { t: 17.4, log: ["scenario", "Hidden PowerShell decrypts both 'PNGs' with the same key → AMSI bypass, then .NET assembly."] },
  { t: 18.8, agent: ["scenario", "complete"] },
  { t: 19.0, agent: ["parallel", "running"], log: ["orchestrator", "Fanning out to 4 specialist agents in parallel."] },
  { t: 19.2, agent: ["network", "running"] }, { t: 19.4, agent: ["filesystem", "running"] },
  { t: 19.6, agent: ["registry", "running"] }, { t: 19.8, agent: ["intel", "running"] },
  { t: 21.0, ioc: 3, log: ["filesystem", "Vile.png decrypted → 245 KB .NET PE (compiled 2024-01-18). Not an image."] },
  { t: 22.2, ioc: 4 },
  { t: 23.0, ioc: 0, log: ["network", "Decompiled config class v9sIVx: FTP C2 at ftp.hhautoinvestment.co.tz (91.204.209.32)."] },
  { t: 23.6, ioc: 1 },
  { t: 24.6, ioc: 7, log: ["registry", "AMSI bypass patches AmsiScanBuffer via VirtualProtect — Defender goes blind."] },
  { t: 26.0, ioc: 2, log: ["network", "Anti-analysis: queries ip-api.com and exits if running on a hosting provider."] },
  { t: 27.2, ioc: 5 },
  { t: 27.8, ioc: 6, log: ["registry", "Run key + %APPDATA%\\eXCXES\\eXCXES.exe — present but disabled in this build."] },
  { t: 29.0, ioc: 8, log: ["intel", "WH_KEYBOARD_LL hook, clipboard chain, screenshots. Steals creds from 20+ apps."] },
  { t: 30.2, ioc: 10, log: ["intel", "Imphash is the default for all .NET EXEs — useless for attribution. TypeRefHash needed."] },
  { t: 31.0, agent: ["network", "complete"] }, { t: 31.3, agent: ["filesystem", "complete"] },
  { t: 31.6, agent: ["registry", "complete"] }, { t: 31.9, agent: ["intel", "complete"] },
  { t: 32.1, agent: ["parallel", "complete"], log: ["orchestrator", "Phase 2 complete — 36 agent turns, $1.29 in API spend."] },
  { t: 32.4, agent: ["critic", "running"], step: 4, log: ["critic", "Cross-checking: C2 config in decompiled source matches network findings — coherent."] },
  { t: 34.4, log: ["critic", "Family attribution UNCONFIRMED — no public hash matches. Reporting as GootLoader-like, not claiming it."] },
  { t: 36.0, agent: ["critic", "complete"] },
  { t: 36.2, agent: ["reporter", "running"], step: 5, log: ["reporter", "Mapping 26 MITRE ATT&CK techniques across 7 tactics."] },
  { t: 38.0, log: ["reporter", "Writing 3-tier remediation plan and detection queries."] },
  { t: 39.4, agent: ["reporter", "complete"] },
  { t: 39.6, agent: ["responder", "running"], log: ["responder", "IOC bundle exported: 1 IP, 2 domains, 3 file paths, 2 hashes."] },
  { t: 41.0, agent: ["responder", "complete"] },
  { t: 41.2, agent: ["orchestrator", "complete"], step: 6, done: true, log: ["orchestrator", "Verdict: CRITICAL — multi-stage dropper delivering a .NET FTP infostealer."] },
];

// Activity lines cycled inside each agent card while running
export const AGENT_ACTIVITY = {
  orchestrator:  ["Initialising pipeline...", "Dispatching stage agents...", "Monitoring sub-agents..."],
  static:        ["Reading magic bytes...", "Computing MD5 / SHA-256 / TLSH...", "Extracting strings...", "Parsing AST with acorn...", "Running YARA rules..."],
  deobfuscation: ["Resolving _0x string array...", "Stripping IMLRHNEGA markers...", "Decoding base64 layers...", "Locating AES key + IV...", "Recovering Stage 2 PowerShell..."],
  scenario:      ["Tracing file drops...", "Projecting PowerShell loader...", "Modelling AMSI bypass..."],
  parallel:      ["Four agents running concurrently..."],
  network:       ["Scanning for C2...", "Decompiling config class...", "FTP C2 identified"],
  filesystem:    ["Decrypting Vile.png...", "PE header analysis...", "Mapping drop paths..."],
  registry:      ["Checking persistence...", "AMSI patch analysis...", "Anti-analysis checks..."],
  intel:         ["Hash lookups...", "Capability mapping...", "Attribution review..."],
  critic:        ["Cross-referencing findings...", "Challenging attribution...", "Validating evidence..."],
  reporter:      ["Mapping ATT&CK...", "Drafting remediation..."],
  responder:     ["Exporting IOC bundle..."],
};

// Canned analyst-chat answers for demo mode (real backend uses Snowflake RAG + Claude)
export const DEMO_CHAT = [
  {
    match: /c2|command|network|ftp|ip/i,
    answer:
      "**C2 is plain FTP**, which is unusual and easy to catch:\n\n- Host: `ftp.hhautoinvestment.co[.]tz`\n- IP: `91.204.209[.]32`\n- Hardcoded account `cmo@hhautoinvestment.co[.]tz` — the password crosses the wire in cleartext\n\nThe domain looks like a **compromised legitimate business**, so notifying the hosting provider is worth doing. Block tcp/21 from `powershell.exe` and alert on any connection to that IP.",
    sources: [{ chunk_type: "c2_infrastructure", similarity: 0.91 }, { chunk_type: "hunt_query", similarity: 0.84 }],
  },
  {
    match: /mitre|att&?ck|technique/i,
    answer:
      "**26 techniques** across 7 tactics. The highest-signal ones:\n\n| ID | Technique |\n|---|---|\n| T1562.001 | AMSI bypass (disable tools) |\n| T1620 | Reflective code loading |\n| T1027.013 | AES-encrypted payloads |\n| T1036.008 | Fake `.png` file type |\n| T1056.001 | Keylogging |\n| T1071.002 | FTP exfiltration |",
    sources: [{ chunk_type: "mitre_technique", similarity: 0.94 }],
  },
  {
    match: /persist|registry|run key|startup/i,
    answer:
      "Persistence exists but is **disabled by default** in this build's config:\n\n- Run key `HKCU\\…\\Run\\eXCXES`\n- Binary copied to `%APPDATA%\\eXCXES\\eXCXES.exe`\n\nSo a single execution is a one-shot theft unless the operator flips the flag. Still sweep for both paths.",
    sources: [{ chunk_type: "capability", similarity: 0.88 }, { chunk_type: "file_drop", similarity: 0.8 }],
  },
  {
    match: /remed|block|do now|contain|immediate|fix/i,
    answer:
      "**Do now:**\n\n1. Block `91.204.209[.]32` and sinkhole the domain\n2. Block outbound FTP from endpoints\n3. Sweep for `C:\\Users\\Public\\Vile.png` / `Mands.png` — presence means it ran\n4. Alert on `wscript.exe → powershell.exe -Noexit -nop`\n\nIf the files are found, assume every saved browser, Outlook, VPN and FTP credential on that host is stolen.",
    sources: [{ chunk_type: "blue_team_summary", similarity: 0.93 }],
  },
];

export const DEMO_CHAT_FALLBACK = {
  answer:
    "This is a **multi-stage dropper**: obfuscated JScript → hidden PowerShell → AMSI bypass → fileless .NET infostealer exfiltrating over FTP. Try asking about the C2, MITRE techniques, persistence, or remediation.",
  sources: [{ chunk_type: "infection_chain_stage", similarity: 0.82 }],
};

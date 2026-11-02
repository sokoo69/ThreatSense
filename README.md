# ThreatSense: Real-Time Dual-Stream Threat Prediction & Affective Masking Detection

ThreatSense is a security-operations-center (SOC) grade real-time threat intelligence dashboard designed around a **Dual-Stream Neural Architecture**:
1. **Stream A — Facial Emotion Recognition**: Continuous 7-class probability distribution ($\text{angry}, \text{fear}, \text{surprise}, \text{disgust}, \text{sad}, \text{neutral}, \text{happy}$).
2. **Stream B — Bengali Lip-Reading (LipBengal)**: Spatiotemporal lip kinematics extracting Bengali transcripts, word confidence, and lip volume metric $A_{\text{vol}}$.

---

## 🔬 Research Premise: Affective Masking & The Zero-Gating Invariant

### The Threat Model
High-risk perpetrators, interrogators, or deceivers frequently display **Affective Masking**: an attacker maintains an impassive, pleasant, or smiling exterior ($\text{face} \in \{\text{neutral}, \text{happy}\}$) while silently mouthing a lethal or hostile threat in Bengali (e.g., mouthing *"বোমা"* or *"সবাইকে শেষ করব"*).

### The Zero-Gating Invariant
In traditional multi-modal pipelines, facial emotion models often act as an early-exit gate — if the face appears calm, lip reading is skipped. **In ThreatSense, lip reading is NEVER gated or skipped by facial emotion.** Both streams run concurrently on every surveillance frame window, and the core predictive signal is the **Cross-Modal Discrepancy ($D_{\text{cross}}$)** between verbal hostility and facial affect.

---

## 📐 Mathematical Framework & Thesis Notation

All core mathematical functions are encapsulated in [`src/engine/threatEngine.ts`](src/engine/threatEngine.ts) with named symbols matching the research derivation:

| Symbol | Name | Domain | Formula / Thesis Definition |
| :--- | :--- | :--- | :--- |
| **$R_e$** | Emotion Risk | $[0.0, 1.0]$ | $R_e = \text{clip}\left(\sum_{e} P(e) \cdot w_e\right)$ |
| **$\theta_W$** | Bengali Lexicon Weight | $[0.0, 1.0]$ | Threat severity weight from `src/data/lexicon.bn.json` |
| **$A_{\text{vol}}$** | Mouth Amplitude | $[0.0, 1.0]$ | Lip-movement physical displacement volume |
| **$g(A_{\text{vol}})$** | Amplitude Transfer | $[0.0, 1.0]$ | Monotonic curve allowing quiet mouthing to register full threat |
| **$T_{\text{lip}}$** | Lip Threat Score | $[0.0, 1.0]$ | $T_{\text{lip}} = \text{clip}\left(\left[1 - \prod (1 - \theta_W \cdot \text{conf})\right] \cdot g(A_{\text{vol}})\right)$ |
| **$D_{\text{cross}}$** | Cross-Modal Discrepancy | $[0.0, 1.0]$ | $D_{\text{cross}} = \max(0, T_{\text{lip}} - R_e) \cdot M_{\text{mask}}$ (when face is calm) |
| **$\text{Threat}\%$** | Composite Threat Score | $0 - 100\%$ | $100 \cdot \text{clip}(\alpha \cdot R_e + \beta \cdot T_{\text{lip}} + \gamma \cdot D_{\text{cross}})$ |

### Threat Classification Bands
- **Low (0 - 30%)**: Green (`#10b981`)
- **Medium (31 - 65%)**: Amber (`#f59e0b`)
- **High (66 - 100%)**: Red (`#ef4444`)
- **Affective Masking**: Violet / Magenta (`#c026d3`) — activates when $D_{\text{cross}} \ge 0.40$ on a calm face, elevating the threat floor to $\ge 40\%$.

---

## 🔌 Connecting Real Models & Thesis Formulas

### 1. Plugging in Exact Thesis Formulas
Open [`src/engine/threatEngine.ts`](src/engine/threatEngine.ts) and locate the prominent `TODO: THESIS FORMULATION REPLACEMENT` block:
- Replace `computeLipThreat` with your exact spatiotemporal word aggregation equation.
- Replace `computeDiscrepancy` with your exact cross-modal discrepancy formula.
- Adjust defaults $\alpha, \beta, \gamma$ or modify them dynamically via the Settings UI.

### 2. Connecting Real Backend Endpoints
Open [`src/api/mock.ts`](src/api/mock.ts):
1. Set `API_CONFIG.USE_MOCK = false`.
2. Configure your FastAPI/Flask endpoints:
   - `POST /api/emotion`: Send image frame, return 7-class probability distribution.
   - `POST /api/lipread-bn`: Send mouth ROI frame sequence, return LipBengal tokens, transliteration, and $A_{\text{vol}}$.
   - `WS /ws/stream`: Full-duplex WebSocket stream for real-time surveillance cameras.

---

## 🖥️ Operator Dashboard (`/`)

The home page is the operator control-room view. The earlier dashboard is kept at `/legacy`.

### Connecting the real backend
Set one environment variable and restart. With it unset, the dashboard runs on simulated data.

```bash
NEXT_PUBLIC_STREAM_WS_URL=ws://localhost:8000/ws/stream npm run dev
```

The browser sends each video frame as one **binary JPEG** message (5 per second, set by `UPLINK_FPS` in `src/components/monitor/useVideoTap.ts`). The backend replies with one **JSON** message per analyzed window. The full contract is `InferenceFrame` in [`src/monitor/types.ts`](src/monitor/types.ts):

```json
{
  "timestamp": 1793612535000,
  "face": {
    "emotions": { "angry": 0.01, "disgust": 0, "fear": 0, "happy": 0.9, "neutral": 0.07, "sad": 0, "surprise": 0.02 },
    "box": { "x": 0.38, "y": 0.14, "w": 0.23, "h": 0.52 }
  },
  "lip": {
    "word": "বোমা",
    "confidence": 0.93,
    "amplitude": 0.6,
    "box": { "x": 0.45, "y": 0.47, "w": 0.1, "h": 0.1 }
  }
}
```

`timestamp` is in milliseconds, and boxes are fractions of the video size. Send `"face": null` when no face is in view and `"lip": null` when no word was decoded. `romanized` and `translation` are optional on `lip`. If no message arrives for 3 seconds the dashboard shows **NO SIGNAL** instead of the last reading.

### How status and score are decided
[`src/monitor/assess.ts`](src/monitor/assess.ts) calls the thesis engine for $R_e$, $T_{\text{lip}}$, $D_{\text{cross}}$ and the fused score, then applies operator rules:

| Status | Condition | Score |
| :--- | :--- | :--- |
| Deception Alert | Calm face and $D_{\text{cross}} \ge 0.40$ | 90 to 100 |
| Critical | $R_e \ge 0.50$ and $T_{\text{lip}} \ge 0.35$ | 85 to 100 |
| Elevated | Either of those signals alone, or a medium engine score | 40 to 84 |
| Normal | No warning signs | 0 to 30 |

Critical and Deception compare both streams, so they cannot fire with a stream switched off. A single stream reaches Elevated at most.

---

## 🇧🇩 Bengali Language & Phonetics
- **Noto Sans Bengali**: Rendered with proper vowel signs, conjuncts (যুক্তাক্ষর), and halant ligatures.
- **UTF-8 BOM CSV Export**: History and offline surveillance logs export with `\uFEFF` byte order mark so Excel displays Bengali text properly without character distortion.
- **Threat Lexicon**: 26 authentic research-graded Bengali tokens in [`src/data/lexicon.bn.json`](src/data/lexicon.bn.json).

---

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Running Unit Tests
```bash
npm test
# or: npx vitest run
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Demo mode is enabled by default with 5 scripted scenarios:
1. Benign Baseline (Calm)
2. Rising Hostility (Anger + Threat)
3. Panic & Fear Spike
4. **Affective Masking (Smiling/Neutral + Silent Threat)** *(Default Scenario)*
5. True Negative (Calm Speech)

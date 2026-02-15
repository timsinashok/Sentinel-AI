# Sentinel AI
### Predicting hazards before they happen.

**Sentinel AI** is a future-aware safety system concept built on top of **NVIDIA Cosmos**: instead of labeling the *current frame* as safe/unsafe, it uses **predictive world modeling** to reason about **future states of the environment** and produce an **early risk score** — enabling proactive mitigation (alerts, slowdowns, reroutes, kill-switches) before a near-miss becomes an incident.

> Safety shift: **reactive perception → predictive prevention**

---

## What’s in this repo

This repository contains an **interactive web demo UI** (Vite + React) that shows the Sentinel AI operator experience:

- **Without Sentinel**: the system only “understands” what happened *after* the event (reactive VLM-style explanation).
- **With Sentinel**: the system surfaces an **early warning** (time-to-hazard + severity) and a **sequence of mitigation actions** before the collision.

The demo is driven by a short clip (`/0.0-14.0.mp4`) plus a lightweight simulation timeline that illustrates the intended end-to-end behavior.

---

## High-level idea (the real system)

Most industrial safety stacks today do:

- **Vision / VLM** → classify **current** frame as safe/unsafe

Sentinel AI instead aims to do:

- **World model (Cosmos)** → encode dynamics and forecast **future** states
- Extract **future-aware latent representations**
- **Early hazard classification** in representation space

Conceptual pipeline:

```text
video → latent embeddings (future-aware) → classifier → risk score + confidence → mitigation
```

---

## What we engineered (systems thinking)

Sentinel AI is designed as a **systems-level optimization**, not a pixel-generation demo.

### 1) Representation-only inference
We keep the predictive signal but skip expensive pixel synthesis:

- Encode frames/clips using Cosmos tokenizer / VAE `encode()`
- **No diffusion head**
- **No future video decoding**

### 2) Fast, reusable embeddings
Latents are pooled into compact vectors that can be:

- Fed into lightweight classifiers (LogReg / SVM / MLP / XGBoost)
- Cached and reused to reduce repeated compute

### 3) Temporal signal without full video generation
Temporal context comes from short snippets (e.g., last 3–5 seconds at low FPS), aggregated directly in embedding space to learn **risk trajectories**.

Tradeoff (intentional):

- **Less fidelity**
- **Much lower latency**
- **More actionable output**

---

## Run the demo locally

### Prerequisites
- **Node.js** \(recommended: 18+\)

### Install

```bash
npm install
```

### Start dev server

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Production build

```bash
npm run build
npm run preview
```

---

## Assets (video + logo)

- **Video**: the demo expects the clip to be available at **`/0.0-14.0.mp4`**.
  - For Vite, the simplest approach is to place it in **`public/0.0-14.0.mp4`** so it’s copied into the build output.
- **Logo**: the header loads **`/logo.png`** \(place in `public/logo.png`\).

---

## Repository layout

- `App.tsx`: main UI + “With/Without Sentinel” mode logic
- `components/ScenePanel.tsx`: video stage + overlays and analysis pause behavior
- `components/RiskSummary.tsx`: risk level + time-to-hazard display
- `components/AgentActionPanel.tsx`: mitigation action timeline
- `constants.ts`: demo timings + initial entities
- `types.ts`: shared types and enums

---

## Why this matters

Predicting hazards *before* they happen can:

- Reduce near-misses and injuries
- Improve human–robot / forklift–pedestrian safety
- Extend from warehouses to factories, construction sites, and autonomous environments

Sentinel AI demonstrates how **world models can be adapted into deployable, safety-critical decision systems** by prioritizing **low-latency risk scoring** over pixel generation.

---

## Acknowledgements

- Built for TreeHacks as a prototype UI + systems concept.
- Inspired by NVIDIA Cosmos and the broader world-modeling ecosystem.
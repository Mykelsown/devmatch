# DevMatch

> A privacy-first developer team-matching platform built on [Midnight](https://midnight.network). Developers register a zero-knowledge commitment of their skills and availability; a ZK match circuit proves compatibility with a project without revealing the raw data.

Built for the [Midnight Full Moon Builder Program](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight)

---

## What This Does

DevMatch matches developers with project teams using zero-knowledge proofs. Developers register their skills, experience, and availability as a commitment on-chain. Teams register their requirements. A ZK circuit proves compatibility between the two commitments, producing a match score, without either side's raw profile data ever being visible to the other.

---

## Contract Address

| Network  | Address                                                          |
|----------|------------------------------------------------------------------|
| Preview  | `2ea2f4d440cbffb41e95efeda584cf8df2cdad82997549389e7ebcf9d1f17db5` |
| Preprod  | not yet deployed                                                  |

Deployed on **2026-07-31** with `npm run deploy:preview`. The address is also recorded in `.midnight-state.json` (gitignored because it contains wallet seeds).

Proof of deployment (Preview):

![DevMatch contract deployed to Midnight Preview](assets/deploy-proof.png)

---

## Privacy Model

DevMatch splits every interaction into three categories:

- **Public (on-chain):** the commitment hash, the trust tier (Yellow/Green), the reveal policy, and the caller's derived on-chain identity (a `persistentHash` of a secret key, domain-separated with `"devmatch:caller:"`).
- **Private (never leaves the browser):** the raw profile data (name, stack, years of experience, hours per week, GitHub handle). It is hashed in the browser into a 32-byte commitment and never sent to the network.
- **Proven without revealing:** the circuit proves that the developer holds a profile whose commitment matches the on-chain value, and that the profile satisfies the match criteria, without disclosing the underlying fields. Only the match score is shared.

---

## Privacy Claim

An on-chain observer sees only a 32-byte commitment, a tier, a policy, and a pseudo-anonymous caller ID. They **cannot** reconstruct the developer's stack, experience, or availability from the ledger. The raw data exists only in the developer's own browser.

---

## Tech Stack

- **Smart contracts:** Compact (Midnight's zero-knowledge contract language)
- **Network:** Midnight Network (Preview)
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Wallet integration:** Midnight.js SDK, Lace dApp connector, 1AM wallet
- **Runtime:** Node.js v22, Docker (proof server)
- **Deployment:** Vercel (frontend)

---

## Prerequisites

- [Node.js](https://nodejs.org) v22 or later
- [Docker](https://docs.docker.com/get-docker/) (for the proof server)
- [Lace wallet](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) Chrome extension (or [1AM](https://chromewebstore.google.com/detail/1am/bphnkdkcnfhompoegfpgnkidcjfbojjp?hl=en))

---

## Run Locally

### 1. Clone and install

```bash
git clone https://github.com/Mykelsown/devmatch.git
cd devmatch
npm install
cd frontend && npm install
```

### 2. Compile the contract (regenerates managed/ artifacts)

```bash
cd frontend && npm run compile
```

This runs `compact compile` and copies the managed contract artifacts into `frontend/src/generated/` and `frontend/public/zk/`.

### 3. Set up environment

Copy the environment template and fill in your values:

```bash
cd frontend
cp .env.example .env
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`, connect your Lace or 1AM wallet (set to the Preview network), and register a profile.

---

## Live Demo

See deployment instructions below.

---

## Demo Video

> To be recorded after deployment. The video should show: wallet connect, profile registration, loading state, on-chain result, and the privacy guarantee that raw input is never shown.

---

## License

MIT

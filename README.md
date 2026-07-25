# DevMatch

A privacy-first developer team-matching platform built on [Midnight](https://midnight.network).

Developers register their skills, experience, and availability as a private commitment. Project posters register their requirements. A zero-knowledge circuit proves compatibility between a dev and a project without either side's raw data ever touching the chain.

Built for the [Midnight Full Moon Builder Program](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight)

---

## How It Works

Every developer profile on DevMatch is split into two parts:

- **On-chain (public):** a commitment hash, a trust tier, and a reveal policy. Nothing sensitive.
- **Off-chain (private):** the raw profile data (stack, years of experience, available hours) stored as private witness state on the developer's own machine.

When a match circuit runs, it takes the raw data as a private witness input, recomputes the hash, checks it against the stored commitment, and runs the compatibility comparisons inside a zero-knowledge proof. The network sees only that a valid match happened, not what the dev's data actually is.

### Trust Tiers

| Tier | What it means |
|---|---|
| Yellow | Self-declared profile. The developer fills in their details manually. |
| Green | CV plus GitHub OAuth. An attester service pulls real contribution stats, builds a Merkle tree of verified profiles, and publishes the root on-chain. Green-tier registration requires a Merkle membership proof. |

### Reveal Policy

Each developer sets their own reveal preference at registration:

- `ScoreOnly`: searchers see only a match score.
- `FieldsOnPolicy`: selected fields (e.g. stack, years) unlock automatically on a match above threshold.
- `ApprovalRequired`: nothing beyond the score reveals until the developer explicitly accepts.

---

## Project Structure

```
devmatch/
├── contracts/
│   └── dev_profile.compact       # Level 1: developer profile registry
├── attester/                     # GitHub OAuth + Merkle attestation service
│   └── src/
├── frontend/                     # React/Vite frontend (Level 2)
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org) v22+
- [Compact toolchain](https://github.com/midnightntwrk/compact) v0.31.1+
- [Docker](https://docs.docker.com/get-docker/) (for the proof server and local devnet)
- [Yarn](https://yarnpkg.com) v1.22+

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Mykelsown/devmatch.git
cd devmatch
```

### 2. Compile the contract

```bash
cd contracts
compact compile dev_profile.compact managed/dev_profile
```

Expected output:
```
Compiling 1 circuits:
  circuit "registerProfile" (k=13, rows=4484)
```

### 3. Start the proof server

In a dedicated terminal tab (leave it running):
```bash
docker run -p 6300:6300 midnightntwrk/proof-server:latest midnight-proof-server -v
```

---

## Contracts

### `dev_profile.compact` (level 1 for now)

Handles developer identity and profile registration.

**Ledger state (public):**
- `profiles`: maps a caller ID to a profile commitment hash
- `tiers`: maps a caller ID to a trust tier (`Yellow` or `Green`)
- `revealPolicies`: maps a caller ID to a reveal policy

**Circuits:**
- `registerProfile(commitment, tier, policy)`: registers a new profile. Enforces one profile per address using a `localSecretKey()` witness hashed into a stable caller ID via `persistentHash`. Reverts if a profile already exists for the caller.

---

## Roadmap

| Level | Status | Scope |
|---|---|---|
| Level 1: New Moon | Done | `dev_profile.compact`, toolchain setup, project scaffold |
| Level 2: Waxing Crescent | In progress | React/Vite frontend, wallet connection, Yellow-tier registration flow, GitHub OAuth button |
| Level 3: First Quarter | Upcoming | Requirement registration contract, Green-tier Merkle proof circuit, match circuit, full token flows |
| Level 4: Waxing Gibbous | Upcoming | MVP live on Preprod, mutual reveal circuit, docs |
| Level 5: Full Moon | Upcoming | Real user onboarding, feedback loop |
| Level 6: Supermoon | Upcoming | Mainnet deployment |

---

## Tech Stack

- **Smart contracts:** Compact (Midnight's ZK smart contract language)
- **Attester service:** Node.js, TypeScript, Express, GitHub OAuth
- **Frontend:** React, Vite, Tailwind CSS
- **Wallet:** Lace (Midnight Preprod)

---

## License

MIT
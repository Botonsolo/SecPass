# 🔐 SecPass

<img width="1907" height="846" alt="SecPass UI" src="https://github.com/user-attachments/assets/ff33cf06-383f-4a7f-90a5-82a216df28de" />

## Why This Project

Password management is still, in practice, broken for most people: credentials scattered across notes, browsers, and memory, weak passwords reused across services, and predictable patterns — birthdates, pet names, keyboard sequences — that are trivial to guess or brute-force. This disorder is one of the most common root causes behind account takeovers and credential-stuffing attacks.

SecPass was built to address that gap directly: a single, secure place to store credentials, removing the incentive to reuse weak or personally-guessable passwords, and applying security-by-design principles from the first line of code rather than bolting them on afterward.

**SecPass** is a password manager built with a security-first design approach. It started as a learning project in applied cryptography and secure development, and is evolving toward a production-ready client-server architecture.

---

## How It Works

SecPass stores credentials [locally / in an encrypted local database — confirm which]. Secrets are protected using the following scheme:

| Layer | Implementation |
|---|---|
| Master password → key derivation | `[e.g. Argon2id / PBKDF2-HMAC-SHA256, iteration count]` |
| Encryption at rest | `[e.g. AES-256-GCM]` |
| Storage format | `[e.g. SQLite file / encrypted JSON blob]` |
| Input validation | `[e.g. schema validation via Pydantic / manual regex checks on X fields]` |

> ⚠️ Replace the placeholders above with the actual implementation. If a control isn't implemented yet, move it to the Roadmap instead of listing it here — an accurate "not yet done" is more credible than an unverified claim.

---

## Threat Model

This project is designed with the following threats in mind:

| Threat | Mitigation |
|---|---|
| Device theft / unauthorized local access | Master password required; data encrypted at rest |
| Credential stuffing from reused passwords | Password strength evaluation (planned, see Roadmap) |
| Storage file exfiltration | Encryption ensures ciphertext is useless without the master key |
| Brute-force on master password | `[e.g. Argon2id cost parameters tuned for X ms per attempt]` |
| Malicious/malformed input | Input validation at the storage boundary |

*Out of scope (for now):* multi-user access control, network-based attacks (no server component yet), memory-scraping protections.

> This section is the most valuable part of the README for a security-focused audience — it shows you think like an analyst, not just a developer. Adjust freely to match what you've actually reasoned through.

---

## Features

**Credential Management**
- Centralized password storage
- Organization of credentials by service
- Fast lookup of stored entries
- Secure deletion of entries

**Security**
- Sensitive data protection at rest
- Minimized data exposure
- Input validation
- Controlled secrets handling
- Attack-surface-conscious design

**Usability**
- Simple, direct interface
- Intuitive workflow
- Quick access to stored credentials

---

## Architecture

Current (local application):

```text
┌─────────────────┐
│      User        │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  SecPass App UI  │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Encrypted Store  │
└─────────────────┘
```

Planned (client-server):

```text
┌────────────┐
│   Client   │
└─────┬──────┘
      │
      ▼
┌─────────────┐
│ SecPass API │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Database   │
└─────────────┘
```

---

## Installation

```bash
git clone https://github.com/[your-username]/secpass.git
cd secpass
pip install -r requirements.txt
python main.py
```

---

## Project Structure

```text
secpass/
│
├── main.py
├── requirements.txt
├── README.md
│
├── src/
│   ├── core/
│   ├── storage/
│   ├── security/
│   └── ui/
│
├── tests/
│
└── docs/
```

---

## Roadmap

**v1.0.0**
- Basic credential management
- Functional interface
- Data persistence

**v1.1.0**
- Controlled password reveal/copy
- UX improvements
- Storage optimization

**v1.2.0**
- Password strength evaluation
- Security recommendations

**v1.3.0**
- Have I Been Pwned integration
- Breach credential verification

**v2.0.0**
- Client-server architecture
- Dedicated API
- Multi-user support
- Production-readiness hardening

---

## What This Project Demonstrates

- Secure-by-design development practices
- Applied cryptography (key derivation, encryption at rest)
- Threat modeling and risk-driven design decisions
- Application hardening principles
- Software engineering fundamentals (structure, testing, documentation)

---

## ⚠️ Disclaimer

SecPass is under active development. It has not undergone a formal security audit or penetration test. Do not use it to store real, sensitive credentials in production until a full review has been completed.

---

## License

[Specify: MIT / Apache 2.0 / etc. — pick one rather than leaving it open-ended; "whatever the owner deems appropriate" reads as unfinished.]

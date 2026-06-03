# Contributing to Zeid Data Lab

This is a public-safe, evidence-first research lab. Contributions are welcome. The bar is evidence and good faith. Everything else is negotiable.

---

## What "Public-Safe" Means

No secrets, private logs, credential material, PII, or data that could identify individuals or expose live systems. If you are not sure whether something is public-safe, open a discussion before filing a PR.

---

## How to Contribute

### File an Issue

Use the issue templates. They exist to structure the information needed to act on your report. Skipping template fields slows things down.

- **Detection gap** — an attack technique or log source not covered by existing detections.
- **Workbook request** — a SOC dashboard or visual analytics artifact for a specific use case.
- **Bug report** — something broken in a script, query, or workflow.

For anything that does not fit a template, open a blank issue and describe the problem clearly.

### Open a Discussion

Use [GitHub Discussions](https://github.com/zeiddata-dev/Research/discussions) for:

- Ideas that are not yet issues
- Questions about how detections work or why they are written a certain way
- Sharing something you built using lab content ("Show and Tell")
- Proposing a collaboration

### Submit a Pull Request

Before opening a PR:

1. Check that an issue exists for what you are fixing or adding. If not, open one first.
2. Keep the PR focused. One detection, one script, one fix — not a combined refactor.
3. Include evidence. What did you test against? What log source? What output confirmed it worked?
4. Follow the existing file structure. Look at how similar files are organized before adding new ones.

PR descriptions should answer: what changed, why it changed, and what proves it works.

---

## Detection Contribution Standards

A detection PR must include:

- The query in the correct format for its target platform (KQL, Sigma, SPL, EQL).
- A comment block at the top of the file: technique name, ATT&CK ID, log source, platform, and author.
- False positive notes — what legitimate activity looks like that might trigger this rule, and how to tune it.
- A reference — public report, CVE, or blog post the detection is based on.

A detection without a reference does not ship.

---

## Code of Conduct

Treat others the way you want to be treated when you are stuck at 2AM with a broken pipeline. Be direct. Be useful. Do not be a problem.

For serious conduct issues, contact radwuan@zeiddata.com.

---

Built for receipts.

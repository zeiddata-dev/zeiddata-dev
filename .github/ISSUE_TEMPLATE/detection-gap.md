---
name: Detection Gap
about: Report an attack technique, threat actor behavior, or log source that is not covered by existing detections.
title: "[GAP] "
labels: detection-gap
assignees: zeiddata-dev
---

## Attack Technique or Behavior

<!-- What is not being detected? Be specific. MITRE ATT&CK ID if applicable. -->

**Technique:**
**ATT&CK ID (if known):**
**Threat actor or malware family (if known):**

---

## Affected Platform or Log Source

<!-- Where should this detection run? -->

- [ ] Microsoft Sentinel / KQL
- [ ] Elastic / EQL
- [ ] Splunk / SPL
- [ ] Sigma (platform-agnostic)
- [ ] Other: ___

**Log source:** (e.g., Windows Security Event Log, Sysmon, Azure AD Sign-In Logs)

---

## Current Coverage

<!-- What exists today, if anything? Link to a detection or say "none." -->

---

## Expected Detection Logic

<!-- Optional: sketch the query logic, IOCs, or behavioral indicators you'd expect a detection to catch. -->

---

## Evidence or References

<!-- Link to a public report, CVE, blog post, or reproduce steps. No private data. -->

---

## Priority Assessment

- [ ] Critical — active exploitation observed
- [ ] High — known TTP with no coverage
- [ ] Medium — coverage exists but has gaps
- [ ] Low — edge case or low-fidelity signal

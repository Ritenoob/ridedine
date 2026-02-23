---
name: pilot-update-workflow
description: |
  How to update the Pilot binary when user asks to "update pilot".
  Use when: (1) user says "update pilot", (2) user asks about pilot versions,
  (3) user tries `pilot update` command. Key insight: `pilot update` does NOT
  exist - must re-run installer or check license dashboard instead.
author: Claude Code
version: 1.0.0
---

# Pilot Update Workflow

## Problem

Users naturally expect `pilot update` to exist, but this command does not exist in the Pilot CLI.

## Context / Trigger Conditions

Use this skill when:
- User says "update pilot" or "upgrade pilot"
- User asks about updating to latest Pilot version
- User tries to run `pilot update` command
- User asks "how do I update pilot?"

## Solution

### Step 1: Check Current Version

```bash
~/.pilot/bin/pilot status
```

### Step 2: Explain Available Update Methods

**`pilot update` does NOT exist.** Instead, use one of these methods:

#### Method 1: Re-run Installer (Most Common)

```bash
curl -fsSL https://pilot.new/install.sh | sh
```

This downloads and installs the latest version, replacing the binary at `~/.pilot/bin/pilot`.

#### Method 2: Manual Download

1. Download the latest binary from the official Pilot source
2. Replace the existing binary at `~/.pilot/bin/pilot`
3. Ensure executable permissions: `chmod +x ~/.pilot/bin/pilot`

#### Method 3: Check License Dashboard

Visit your Pilot account/license portal for version-specific update instructions.

## Verification

After updating, verify the new version:

```bash
~/.pilot/bin/pilot status
```

## Key Points

- **`pilot update` does NOT exist** - this is documented in `cli-tools.md`
- Users expect it because "update" is a natural command name
- The installer script handles updates by replacing the binary
- No package manager integration (not in apt, brew, npm, etc.)

## References

- `.claude/rules/cli-tools.md` - Documents that `pilot update` does not exist

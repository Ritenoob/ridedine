# Security Vulnerability Status

**Last Updated:** 2026-02-25

## Fixed Vulnerabilities ✅

### 1. esbuild (Medium Severity) - FIXED
- **Issue:** Development server vulnerability in esbuild <= 0.24.2
- **Fix:** Upgraded to esbuild@0.27.3 via pnpm overrides
- **Status:** ✅ Resolved

### 2. send (Low Severity) - FIXED
- **Issue:** XSS template injection in send < 0.19.0
- **Fix:** Upgraded to send@0.19.2 via pnpm overrides
- **Status:** ✅ Resolved

## Known Issues ⚠️

### 1. ip Package (High Severity) - NO PATCH AVAILABLE
- **Package:** ip@1.1.9
- **Vulnerability:** SSRF improper categorization in isPublic (CVE pending)
- **Severity:** High
- **Status:** ⚠️ Awaiting upstream patch

#### Risk Assessment: LOW
Despite the "high severity" classification, the **practical risk is LOW** because:

1. **Development-only dependency**: Used only by React Native CLI tooling (`@react-native-community/cli-doctor` and `@react-native-community/cli-hermes`)
2. **Not in production**: This package is NOT bundled into the mobile app or web app
3. **Limited attack surface**: Only runs during development on localhost
4. **Requires active exploitation**: Attacker would need access to the development machine and trigger the CLI tools

#### Dependency Path
```
react-native@0.73.0
└── @react-native-community/cli@12.1.1
    ├── @react-native-community/cli-doctor@12.1.1 → ip@1.1.9
    └── @react-native-community/cli-hermes@12.1.1 → ip@1.1.9
```

#### Mitigation Strategy
- **Current:** Accept risk (dev-only, low exposure)
- **Monitoring:** Waiting for React Native to update their CLI dependencies
- **Alternative:** If needed, could upgrade to React Native 0.74+ when available (check if they've updated the `ip` dependency)

#### When to Revisit
- When React Native releases a version that removes or updates the `ip` dependency
- If a patched version of `ip` (>2.0.1) becomes available
- If the vulnerability is proven to be exploitable in our specific use case

## Dependency Override Configuration

The following overrides are configured in root `package.json` to enforce secure versions:

```json
"pnpm": {
  "overrides": {
    "esbuild": ">=0.27.3",
    "send": ">=0.19.0"
  }
}
```

Note: `ip` override not added because no patched version exists (latest is 2.0.1, still vulnerable).

## Monitoring

GitHub Dependabot is configured and will alert when:
- New vulnerabilities are discovered
- Patches become available for existing vulnerabilities
- The `ip` package releases a fixed version

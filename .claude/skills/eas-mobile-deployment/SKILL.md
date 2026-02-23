---
name: eas-mobile-deployment
description: |
  Master Expo Application Services (EAS) deployment for RidenDine mobile app. Use when: (1)
  building for iOS/Android, (2) submitting to App Store/Play Store, (3) configuring app signing,
  (4) managing build profiles, (5) over-the-air updates. Key insight: EAS Build for native
  compilation, EAS Submit for store uploads, EAS Update for OTA updates without app store review.
author: Claude Code
version: 1.0.0
---

# EAS Mobile Deployment

## Problem

RidenDine mobile app (Expo SDK 50) uses EAS for iOS/Android builds and deployments. EAS Build compiles native code in the cloud, EAS Submit pushes to app stores, EAS Update delivers OTA updates for JavaScript changes.

## Context / Trigger Conditions

Use this skill when:
- Building for iOS or Android
- Submitting to App Store or Play Store
- Configuring app signing and credentials
- Managing development/preview/production builds
- Deploying OTA updates
- Debugging build failures

## Pattern 1: EAS Configuration

**Location:** `apps/mobile/eas.json`

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "TEAMID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Pattern 2: Building for Development

```bash
cd apps/mobile

# iOS Simulator
eas build --profile development --platform ios

# Android Emulator
eas build --profile development --platform android

# Install on device
eas build:run -p ios
```

## Pattern 3: Building for Production

```bash
# iOS Production Build
eas build --profile production --platform ios

# Android Production Build
eas build --profile production --platform android

# Both platforms
eas build --profile production --platform all
```

## Pattern 4: App Store Submission

```bash
# Submit iOS to App Store
eas submit --platform ios --latest

# Submit Android to Play Store
eas submit --platform android --latest
```

## Pattern 5: OTA Updates

```bash
# Publish update to production channel
eas update --channel production --message "Bug fixes"

# Publish to preview channel
eas update --channel preview --message "New feature testing"

# View update status
eas update:view --channel production
```

## Debugging Build Failures

**Issue: Credentials not configured**

Fix: Run `eas credentials` to set up iOS/Android signing

**Issue: Build timeout**

Fix: Check for large dependencies, optimize bundle size

**Issue: Native module error**

Fix: Verify expo-dev-client installed, rebuild development client

## References

- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/
- EAS Update: https://docs.expo.dev/eas-update/introduction/

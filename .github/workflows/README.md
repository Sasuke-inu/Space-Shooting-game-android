# CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment of the Neon Void Space Shooter game.

## 📋 Table of Contents

- [Workflows Overview](#workflows-overview)
- [Setup Instructions](#setup-instructions)
- [Required Secrets](#required-secrets)
- [Workflow Triggers](#workflow-triggers)
- [Build Profiles](#build-profiles)
- [Manual Workflow Dispatch](#manual-workflow-dispatch)
- [Troubleshooting](#troubleshooting)

---

## Workflows Overview

### 1. CI Workflow (`ci.yml`)

Runs automated quality checks on every pull request and push to main/develop branches.

**Jobs:**
- **Lint**: ESLint code quality checks
- **Type Check**: TypeScript type validation
- **Test**: Jest unit tests execution

**When it runs:**
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

### 2. Build & Deploy Workflow (`build-deploy.yml`)

Builds and deploys the app to iOS and Android platforms using Expo EAS.

**Jobs:**
- **Build iOS**: Creates iOS build with EAS Build
- **Submit iOS**: Submits to TestFlight (preview builds only)
- **Build Android**: Creates Android build with EAS Build
- **Submit Android**: Submits to Google Play internal track (preview builds only)

**When it runs:**
- Pushes to `main` (automatic deployment)
- Manual trigger via GitHub Actions UI (with platform/profile selection)

---

## Setup Instructions

### Prerequisites

1. **Expo Account**
   - Sign up at [expo.dev](https://expo.dev)
   - Create a project for your app
   - Install EAS CLI: `npm install -g eas-cli`

2. **Apple Developer Account** (for iOS)
   - Enroll at [developer.apple.com](https://developer.apple.com)
   - Create App Store Connect API Key
   - Configure app in App Store Connect

3. **Google Play Developer Account** (for Android)
   - Register at [play.google.com/console](https://play.google.com/console)
   - Create service account with API access
   - Download service account JSON key

### Initial Setup Steps

1. **Configure EAS Build**
   ```bash
   # Login to Expo
   eas login

   # Configure the project
   eas build:configure
   ```

2. **Create Expo Access Token**
   ```bash
   # Generate a token for CI/CD
   eas token:create --description "GitHub Actions"
   ```
   Save this token - you'll add it to GitHub Secrets as `EXPO_TOKEN`.

3. **Configure iOS Credentials**
   ```bash
   # Generate or upload certificates
   eas credentials
   ```

4. **Configure Android Keystore**
   ```bash
   # Generate Android keystore
   eas credentials
   ```

5. **Add Secrets to GitHub**
   - Go to your repository settings
   - Navigate to `Settings > Secrets and variables > Actions`
   - Add all required secrets (see next section)

---

## Required Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Essential Secrets

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `EXPO_TOKEN` | Expo access token for EAS CLI authentication | Run `eas token:create` in terminal |
| `APPLE_APP_STORE_CONNECT_API_KEY` | Apple App Store Connect API key for TestFlight submission | Generate in [App Store Connect](https://appstoreconnect.apple.com/access/api) under Users and Access > Keys |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play service account JSON for Play Store submission | Create service account in [Google Cloud Console](https://console.cloud.google.com) and download JSON key |

### How to Add Secrets

1. Go to `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. Click "New repository secret"
3. Enter the secret name and value
4. Click "Add secret"

### Generating EXPO_TOKEN

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Create a token for CI/CD
eas token:create --description "GitHub Actions CI/CD"

# Copy the generated token and add it to GitHub Secrets
```

### Generating APPLE_APP_STORE_CONNECT_API_KEY

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** > **Keys** (under App Store Connect API)
3. Click the **+** button to create a new key
4. Enter a name (e.g., "GitHub Actions")
5. Select **Developer** role
6. Click **Generate**
7. Download the `.p8` key file
8. Copy the **Key ID** and **Issuer ID**
9. Create the app-specific password:
   - Go to [appleid.apple.com](https://appleid.apple.com)
   - Sign in and go to **Security** > **App-Specific Passwords**
   - Generate a new password
   - Copy and add to GitHub Secrets as `APPLE_APP_STORE_CONNECT_API_KEY`

### Generating GOOGLE_PLAY_SERVICE_ACCOUNT_JSON

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Enter a name (e.g., "GitHub Actions Deploy")
6. Grant the account **Service Account User** role
7. Click **Done**
8. Click on the created service account
9. Go to **Keys** tab > **Add Key** > **Create new key**
10. Select **JSON** format
11. Download the JSON file
12. Go to [Google Play Console](https://play.google.com/console)
13. Navigate to **Setup** > **API access**
14. Link the service account and grant **Release Manager** permissions
15. Copy the entire JSON file contents and add to GitHub Secrets as `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

---

## Workflow Triggers

### CI Workflow Triggers

The CI workflow runs automatically on:

```yaml
# Pull requests targeting these branches
pull_request:
  branches:
    - main
    - develop

# Pushes to these branches
push:
  branches:
    - main
    - develop
```

**Use Cases:**
- ✅ Validates code quality before merging PRs
- ✅ Ensures TypeScript types are correct
- ✅ Runs all unit tests
- ✅ Prevents broken code from reaching main branch

### Build & Deploy Workflow Triggers

The Build & Deploy workflow runs on:

```yaml
# Automatic: Pushes to main branch
push:
  branches:
    - main

# Manual: Via GitHub Actions UI
workflow_dispatch:
  inputs:
    platform: [all, ios, android]
    profile: [preview, production]
```

**Automatic Trigger (Push to Main):**
- Builds both iOS and Android
- Uses `preview` profile by default
- Submits to TestFlight and Play Store internal track

**Manual Trigger:**
- Choose specific platform (iOS, Android, or both)
- Choose build profile (preview or production)
- Trigger from GitHub Actions tab

---

## Build Profiles

Build profiles are defined in `eas.json` at the project root.

### Available Profiles

| Profile | Purpose | Distribution | Output |
|---------|---------|--------------|--------|
| `development` | Local development with dev client | Internal | APK (Android), Development build (iOS) |
| `preview` | Internal testing, TestFlight, Play Store internal | Internal | APK (Android), Ad-hoc (iOS) |
| `production` | App Store and Play Store releases | Store | AAB (Android), App Store (iOS) |

### Profile Configuration

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "bundleIdentifier": "com.spaceshooter.app"
      },
      "android": {
        "packageName": "com.spaceshooter.app",
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.spaceshooter.app"
      },
      "android": {
        "packageName": "com.spaceshooter.app"
      }
    }
  }
}
```

### When to Use Each Profile

- **Development**: Local testing with Expo Go or development builds
- **Preview**: Internal team testing, QA, stakeholder demos
- **Production**: Final release to App Store and Google Play Store

---

## Manual Workflow Dispatch

You can manually trigger builds from the GitHub Actions UI.

### Steps to Manually Trigger Build

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Build & Deploy** workflow from the left sidebar
4. Click **Run workflow** button (top right)
5. Fill in the options:
   - **Branch**: Select branch to build from (usually `main`)
   - **Platform**: Choose `all`, `ios`, or `android`
   - **Profile**: Choose `preview` or `production`
6. Click **Run workflow**

### Example Use Cases

**Scenario 1: Emergency iOS Hotfix**
```
Branch: main
Platform: ios
Profile: production
```

**Scenario 2: Internal Android Testing**
```
Branch: develop
Platform: android
Profile: preview
```

**Scenario 3: Full Production Release**
```
Branch: main
Platform: all
Profile: production
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. ❌ "EXPO_TOKEN is invalid or expired"

**Problem:** The Expo token has expired or is incorrect.

**Solution:**
```bash
# Generate a new token
eas token:create --description "GitHub Actions"

# Update the GitHub Secret with the new token
# Go to Settings > Secrets > Actions > EXPO_TOKEN > Update
```

---

#### 2. ❌ "Build failed: No matching provisioning profile"

**Problem:** iOS provisioning profile is missing or expired.

**Solution:**
```bash
# Regenerate iOS credentials
eas credentials

# Select: iOS > Production > Provisioning Profile > Regenerate
```

---

#### 3. ❌ "Android build failed: Keystore not found"

**Problem:** Android keystore is not configured in Expo.

**Solution:**
```bash
# Configure Android credentials
eas credentials

# Select: Android > Production > Keystore > Generate new keystore
```

---

#### 4. ❌ "TestFlight submission failed"

**Problem:** Apple App Store Connect API key is invalid or app is not configured.

**Solution:**
- Verify `APPLE_APP_STORE_CONNECT_API_KEY` secret is correct
- Ensure app exists in App Store Connect
- Check that bundle identifier matches (`com.spaceshooter.app`)
- Verify app-specific password is generated correctly

---

#### 5. ❌ "Google Play submission failed"

**Problem:** Service account permissions are insufficient or JSON is malformed.

**Solution:**
- Verify service account has **Release Manager** role in Play Console
- Check that `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` is valid JSON
- Ensure app exists in Google Play Console
- Verify package name matches (`com.spaceshooter.app`)

---

#### 6. ❌ "npm ci failed"

**Problem:** Dependency installation failed due to lock file mismatch.

**Solution:**
```bash
# Locally regenerate package-lock.json
rm package-lock.json
npm install

# Commit the updated lock file
git add package-lock.json
git commit -m "fix: Update package-lock.json"
git push
```

---

#### 7. ❌ "Tests failing in CI but pass locally"

**Problem:** Environment differences between local and CI.

**Solution:**
- Check Node.js version matches (CI uses Node 20)
- Ensure all dependencies are in `package.json` (not just `devDependencies`)
- Look for hardcoded paths or environment-specific code
- Run `npm ci` locally to replicate CI environment

---

#### 8. ❌ "Build is stuck in queue for too long"

**Problem:** EAS Build queue is congested or build is waiting for resources.

**Solution:**
- Wait for build to complete (can take 10-30 minutes)
- Check build status: `eas build:list`
- Cancel stuck build: `eas build:cancel <build-id>`
- Retry: Re-run the workflow

---

#### 9. ❌ "Workflow not triggering on push"

**Problem:** Workflow file has syntax errors or branch protection rules are blocking.

**Solution:**
- Validate workflow YAML syntax
- Check branch name matches trigger conditions
- Verify repository settings allow Actions
- Look for workflow run in Actions tab (might have failed silently)

---

#### 10. ❌ "Secret not found during workflow run"

**Problem:** Secret name is misspelled or not added to repository.

**Solution:**
- Go to `Settings > Secrets and variables > Actions`
- Verify secret exists with exact name (case-sensitive)
- Re-add secret if necessary
- Check if secret is repository-level (not environment-level)

---

### Debugging Tips

#### View Workflow Logs

1. Go to **Actions** tab in GitHub
2. Click on the failed workflow run
3. Click on the failed job
4. Expand the failed step to see detailed logs

#### Check EAS Build Logs

```bash
# List recent builds
eas build:list

# View specific build logs
eas build:view <build-id>
```

#### Test Locally Before CI

```bash
# Run all CI checks locally
npm run lint
npm run typecheck
npm run test

# Test build locally
eas build --platform ios --profile preview --local
eas build --platform android --profile preview --local
```

#### Enable Debug Logging

Add this to workflow steps for verbose output:

```yaml
- name: Debug step
  run: |
    echo "Debug information"
    env
  env:
    DEBUG: '*'
```

---

### Getting Help

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Build Docs**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/)
- **GitHub Actions Docs**: [docs.github.com/actions](https://docs.github.com/actions)
- **Expo Forums**: [forums.expo.dev](https://forums.expo.dev)

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Push/PR                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─────────────────┬─────────────────┬────────
                 │                 │                 │
                 ▼                 ▼                 ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │     Lint     │  │  Type Check  │  │     Test     │
         └──────────────┘  └──────────────┘  └──────────────┘
                 │                 │                 │
                 └────────┬────────┴────────┬────────┘
                          │                 │
                          ▼                 ▼
                   ┌──────────────┐  ┌──────────────┐
                   │  Build iOS   │  │Build Android │
                   └──────┬───────┘  └──────┬───────┘
                          │                 │
                          ▼                 ▼
                   ┌──────────────┐  ┌──────────────┐
                   │  TestFlight  │  │  Play Store  │
                   └──────────────┘  └──────────────┘
```

---

**Last Updated:** January 2025
**Maintained By:** Development Team
**Questions?** Open an issue or contact the maintainers.

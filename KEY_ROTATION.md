# API Key Rotation Guide

## ⚠️ SECURITY INCIDENT

**Date Exposed:** Initial commit (c8f3660e80ef3fa89cc160b1b7b01a9a324bf7de)
**Severity:** Critical
**Status:** Git history cleaned - API keys require manual rotation

## What Happened

The `.env` file containing API keys was accidentally committed to git version control and remained in the repository history. This exposed sensitive credentials to anyone with repository access.

## Exposed API Keys

The following API keys were exposed in git history and **MUST BE ROTATED IMMEDIATELY**:

1. ✅ **OpenAI API Key** (`EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY`)
2. ✅ **Anthropic API Key** (`EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY`)
3. ✅ **Grok API Key** (`EXPO_PUBLIC_VIBECODE_GROK_API_KEY`)
4. ✅ **Google API Key** (`EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY`)
5. ✅ **ElevenLabs API Key** (`EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY`)

---

## Step-by-Step Key Rotation Instructions

### 1. OpenAI API Key

**Provider:** OpenAI
**Key Name:** `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY`

#### Rotation Steps:
1. Visit [OpenAI API Keys Dashboard](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Locate the exposed API key (if you named it, you can identify it)
4. Click the **"Revoke"** or delete button next to the compromised key
5. Click **"Create new secret key"**
6. Give it a descriptive name (e.g., "Space Shooter Game - 2026")
7. Copy the new API key **immediately** (you won't be able to see it again)
8. Update your local `.env` file with the new key
9. Verify the old key is fully revoked

**Documentation:** [OpenAI API Keys Guide](https://platform.openai.com/docs/api-reference/authentication)

---

### 2. Anthropic API Key

**Provider:** Anthropic (Claude)
**Key Name:** `EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY`

#### Rotation Steps:
1. Visit [Anthropic Console - API Keys](https://console.anthropic.com/settings/keys)
2. Sign in to your Anthropic account
3. Find the exposed API key in your keys list
4. Click **"Delete"** or revoke the compromised key
5. Click **"Create Key"**
6. Give it a meaningful name (e.g., "Space Shooter - Production")
7. Copy the new API key immediately
8. Update your local `.env` file with the new key
9. Test the new key with a simple API request

**Documentation:** [Anthropic API Authentication](https://docs.anthropic.com/en/api/getting-started)

---

### 3. Grok API Key

**Provider:** X.AI (Grok)
**Key Name:** `EXPO_PUBLIC_VIBECODE_GROK_API_KEY`

#### Rotation Steps:
1. Visit [X.AI Console](https://console.x.ai/)
2. Sign in with your X.AI/Twitter account
3. Navigate to **API Keys** section
4. Revoke or delete the exposed API key
5. Generate a new API key
6. Copy the new key immediately
7. Update your local `.env` file with the new key
8. Verify the old key no longer works

**Note:** X.AI is a newer service - API key management interface may vary.

---

### 4. Google API Key

**Provider:** Google Cloud Platform
**Key Name:** `EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY`

#### Rotation Steps:
1. Visit [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Sign in to your Google Cloud account
3. Select the correct project from the dropdown
4. Find the exposed API key under **"API Keys"** section
5. Click on the key name to view details
6. Click **"Delete"** to remove the compromised key
7. Click **"Create Credentials"** → **"API Key"**
8. A new key will be generated automatically
9. (Optional) Click **"Restrict Key"** to add API restrictions for security
10. Copy the new API key
11. Update your local `.env` file with the new key

**Important:** If this key has API restrictions, make sure to apply the same restrictions to the new key.

**Documentation:** [Google Cloud API Keys Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

### 5. ElevenLabs API Key

**Provider:** ElevenLabs (Text-to-Speech)
**Key Name:** `EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY`

#### Rotation Steps:
1. Visit [ElevenLabs API Settings](https://elevenlabs.io/app/settings/api-keys)
2. Sign in to your ElevenLabs account
3. Locate the exposed API key in your keys list
4. Click **"Delete"** or revoke button for the compromised key
5. Click **"Generate new API key"** or **"Create API Key"**
6. Copy the new key immediately
7. Update your local `.env` file with the new key
8. Test with a simple TTS request to verify

**Documentation:** [ElevenLabs API Documentation](https://elevenlabs.io/docs/api-reference/authentication)

---

## Post-Rotation Checklist

After rotating **ALL** API keys:

- [ ] All 5 keys have been rotated at their respective provider dashboards
- [ ] Old keys have been explicitly revoked/deleted (not just replaced)
- [ ] New keys have been copied to your local `.env` file
- [ ] Local `.env` file has been saved
- [ ] App has been tested to ensure new keys work correctly
- [ ] Monitor API usage for the next 48 hours for any unauthorized activity
- [ ] Review API billing/usage dashboards for each provider to check for suspicious activity during the exposure period

---

## Prevention Measures Implemented

The following measures have been put in place to prevent this from happening again:

1. ✅ `.env` file removed from git index and history
2. ✅ `.env` added to `.gitignore`
3. ✅ `.env.example` created with placeholder values for onboarding
4. ✅ Git history rewritten to remove all traces of exposed keys

---

## Next Steps

### Immediate (Required)
1. **Rotate all 5 API keys** using the instructions above
2. **Update your local `.env`** with the new keys
3. **Test the application** to ensure everything works

### For Repository Collaborators
If you are not the repository owner but have cloned this repository:

1. **Delete your local clone** completely
2. **Re-clone the repository** after the owner force-pushes the cleaned history
3. **Set up your `.env`** file using `.env.example` as a template
4. **Contact the repository owner** for the new API keys (if shared)

### For Repository Owner
After completing key rotation:

1. **Force push the cleaned repository:**
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

2. **Notify all collaborators** to delete and re-clone the repository

3. **Monitor API usage** for unusual activity for the next week

---

## Support & Questions

If you have questions about key rotation or need assistance:

- **OpenAI Support:** https://help.openai.com/
- **Anthropic Support:** support@anthropic.com
- **Google Cloud Support:** https://cloud.google.com/support
- **ElevenLabs Support:** https://elevenlabs.io/support

---

## Timeline

| Event | Date | Status |
|-------|------|--------|
| Keys exposed in git commit | Initial commit (c8f3660e) | ⚠️ Compromised |
| Security issue identified | 2026-01-21 | ✅ Detected |
| Git history cleaned | 2026-01-21 | ✅ Complete |
| API keys rotated | **PENDING** | ⏳ Action Required |

---

**Last Updated:** 2026-01-22
**Document Version:** 1.0

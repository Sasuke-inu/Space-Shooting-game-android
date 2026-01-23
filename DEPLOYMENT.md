# Space Shooter - Deployment Guide

This guide covers deploying the Space Shooter mobile app with its backend proxy server for production use.

## Architecture Overview

The application consists of two main components:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Mobile App    │────────▶│  Backend Proxy   │────────▶│  External APIs  │
│  (React Native) │         │   (Node.js)      │         │ (OpenAI, Grok)  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
     Expo App                Port 3000 / HTTPS            With API Keys
```

**Key Security Feature:** API keys are stored only on the backend server, never in the mobile app bundle.

## Prerequisites

### Backend Server
- Node.js >= 18.0.0
- npm >= 8.0.0
- Server/hosting platform with HTTPS support
- Valid API keys for external services

### Mobile App
- Node.js >= 18.0.0
- Expo CLI installed globally: `npm install -g expo-cli`
- Expo account (for EAS Build)
- iOS Developer account (for iOS deployment)
- Google Play Console account (for Android deployment)

## Deployment Steps

### 1. Backend Deployment

The backend must be deployed first, as the mobile app needs its URL.

#### Option A: Deploy to Railway (Recommended)

[Railway](https://railway.app) offers easy deployment with automatic HTTPS.

1. **Create Railway account** at https://railway.app

2. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

3. **Login to Railway:**
   ```bash
   railway login
   ```

4. **Deploy backend:**
   ```bash
   cd backend
   railway init
   railway up
   ```

5. **Set environment variables in Railway dashboard:**
   - Go to your project → Variables
   - Add all variables from `.env.example`:
     ```
     OPENAI_API_KEY=sk-proj-your-key
     ANTHROPIC_API_KEY=sk-ant-your-key
     GROK_API_KEY=xai-your-key
     GOOGLE_API_KEY=your-key
     ELEVENLABS_API_KEY=your-key
     PORT=3000
     NODE_ENV=production
     ```

6. **Get your deployment URL:**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Note this URL - you'll need it for mobile app configuration

7. **Verify deployment:**
   ```bash
   curl https://your-app.railway.app/health
   ```

#### Option B: Deploy to Heroku

1. **Create Heroku account** at https://heroku.com

2. **Install Heroku CLI:**
   ```bash
   brew install heroku/brew/heroku  # macOS
   # or visit: https://devcenter.heroku.com/articles/heroku-cli
   ```

3. **Login and create app:**
   ```bash
   heroku login
   cd backend
   heroku create your-app-name
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set OPENAI_API_KEY=sk-proj-your-key
   heroku config:set GROK_API_KEY=xai-your-key
   heroku config:set NODE_ENV=production
   # ... add all other keys
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

6. **Your URL:** `https://your-app-name.herokuapp.com`

#### Option C: Deploy to DigitalOcean App Platform

1. **Create DigitalOcean account** at https://digitalocean.com

2. **Create new App:**
   - Go to App Platform → Create App
   - Connect your GitHub repository
   - Select `backend` folder as source directory

3. **Configure build settings:**
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`

4. **Add environment variables** in App settings

5. **Deploy** and note your app URL

#### Option D: Self-hosted VPS (Advanced)

For self-hosting on a VPS (AWS EC2, DigitalOcean Droplet, etc.):

1. **Setup server with Node.js:**
   ```bash
   # SSH into your server
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone repository:**
   ```bash
   git clone your-repo-url
   cd space-shooter/backend
   npm install
   npm run build
   ```

3. **Setup environment:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your API keys
   ```

4. **Setup process manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name space-shooter-backend
   pm2 startup  # Auto-start on reboot
   pm2 save
   ```

5. **Setup reverse proxy (nginx) with SSL:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Get SSL certificate (Let's Encrypt):**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### 2. Mobile App Configuration

After backend is deployed, configure the mobile app to use the production backend URL.

#### Update Environment Configuration

1. **Edit `.env` file:**
   ```bash
   # Replace localhost with your production backend URL
   EXPO_PUBLIC_API_URL=https://your-app.railway.app
   ```

2. **For multiple environments**, create environment-specific files:

   **`.env.development`:**
   ```bash
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

   **`.env.staging`:**
   ```bash
   EXPO_PUBLIC_API_URL=https://staging.your-domain.com
   ```

   **`.env.production`:**
   ```bash
   EXPO_PUBLIC_API_URL=https://api.your-domain.com
   ```

3. **Install dotenv CLI for environment switching:**
   ```bash
   npm install -g dotenv-cli
   ```

4. **Update `package.json` scripts:**
   ```json
   {
     "scripts": {
       "start": "dotenv -e .env.development expo start",
       "start:staging": "dotenv -e .env.staging expo start",
       "start:production": "dotenv -e .env.production expo start"
     }
   }
   ```

#### Verify Mobile App Connection

1. **Start Expo development server:**
   ```bash
   npm start
   ```

2. **Open app on device/simulator**

3. **Test AI features** (chat, transcription) to verify backend connection

4. **Check backend logs** to confirm requests are being received

### 3. Build Mobile App for Production

#### iOS Build (using EAS Build)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Create production build:**
   ```bash
   eas build --platform ios --profile production
   ```

5. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

#### Android Build (using EAS Build)

1. **Create production build:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Google Play:**
   ```bash
   eas submit --platform android
   ```

#### Local Builds (Alternative)

**iOS:**
```bash
expo run:ios --configuration Release
```

**Android:**
```bash
expo run:android --variant release
```

## Environment-Specific Configuration

### Development Environment
- Backend: `http://localhost:3000`
- Mobile: Points to localhost
- Use for local testing only

### Staging Environment
- Backend: Deployed to staging server (e.g., `https://staging-api.your-domain.com`)
- Mobile: `.env.staging` with staging backend URL
- Use for QA testing before production release

### Production Environment
- Backend: Deployed to production server with HTTPS (e.g., `https://api.your-domain.com`)
- Mobile: `.env.production` with production backend URL
- Use for app store releases

## Security Checklist

Before deploying to production, verify:

- [ ] **Backend deployed with HTTPS** (not HTTP)
- [ ] **All API keys in backend `.env` only** (not in mobile app)
- [ ] **Backend `.env` file NOT committed to git**
- [ ] **CORS configured for production** (whitelist only your domains)
- [ ] **Rate limiting enabled** on backend (recommended)
- [ ] **Error messages don't expose sensitive information**
- [ ] **Mobile app `.env` contains NO secret API keys** (only backend URL)
- [ ] **Mobile app bundle inspected** - no API keys in compiled code
- [ ] **Backend server logs don't log sensitive data**

### Verify No API Keys in Mobile Bundle

```bash
# Build mobile app
npm run build

# Search for API keys in bundle
expo export --platform ios --output-dir dist
grep -r "sk-proj\|sk-ant\|xai-" dist/ && echo "❌ KEYS FOUND" || echo "✅ CLEAN"
```

## Monitoring and Maintenance

### Backend Monitoring

1. **Health checks:**
   ```bash
   curl https://your-api.com/health
   ```

2. **Setup uptime monitoring** (e.g., UptimeRobot, Pingdom)

3. **Monitor logs:**
   ```bash
   # Railway
   railway logs

   # Heroku
   heroku logs --tail

   # PM2
   pm2 logs space-shooter-backend
   ```

4. **Monitor API usage** in provider dashboards:
   - OpenAI: https://platform.openai.com/usage
   - Grok: https://console.x.ai/

### Backend Updates

```bash
cd backend
git pull origin main
npm install
npm run build
npm start  # or restart via PM2/Railway/Heroku
```

### Mobile App Updates

1. **Make code changes**
2. **Test with staging backend**
3. **Update version in `app.json`**
4. **Build and submit new version:**
   ```bash
   eas build --platform all --profile production
   eas submit --platform all
   ```

## Troubleshooting

### Mobile app can't connect to backend

1. **Check backend URL** in mobile `.env`:
   ```bash
   cat .env
   # Should show: EXPO_PUBLIC_API_URL=https://...
   ```

2. **Verify backend is running:**
   ```bash
   curl https://your-api.com/health
   ```

3. **Check CORS configuration** in backend

4. **Verify HTTPS** (mobile apps require HTTPS in production)

5. **Check mobile app console logs** for error messages

### Backend returns 500 errors

1. **Check backend logs** for error details

2. **Verify API keys** are set correctly in backend environment

3. **Test API keys** manually:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_OPENAI_KEY"
   ```

4. **Check external API service status** (OpenAI, Grok status pages)

### Build fails with API key errors

This usually means API keys are still in mobile app code (should only be in backend).

1. **Check mobile `.env` file** - should only contain `EXPO_PUBLIC_API_URL`

2. **Search for API keys in code:**
   ```bash
   grep -r "OPENAI_API_KEY\|GROK_API_KEY" src/
   # Should find NO results
   ```

3. **Verify using proxy client:**
   ```bash
   grep -r "localhost:3000" src/api/
   # Should find openai.ts, grok.ts, transcribe-audio.ts
   ```

### iOS/Android build fails

1. **Check EAS build logs:**
   ```bash
   eas build:list
   ```

2. **Verify `app.json` configuration**

3. **Ensure all dependencies are compatible** with current Expo SDK

4. **Check for native module issues** in build logs

## Rollback Procedure

### Backend Rollback

**Railway/Heroku:**
- Use platform's rollback feature to previous deployment

**Self-hosted:**
```bash
cd backend
git log --oneline  # Find previous working commit
git checkout <commit-hash>
npm install
npm run build
pm2 restart space-shooter-backend
```

### Mobile App Rollback

- App stores don't support instant rollback
- Users may still have old version installed
- Ensure backend remains compatible with previous mobile app versions
- Consider phased rollouts to catch issues early

## Cost Estimates

### Backend Hosting

- **Railway**: ~$5-10/month for hobby tier
- **Heroku**: ~$7/month for basic dyno
- **DigitalOcean**: ~$5-10/month for basic droplet
- **AWS/GCP**: Variable, ~$10-20/month with free tier

### External API Costs

- **OpenAI**: Pay-per-use (GPT-3.5: ~$0.002/1K tokens)
- **Grok**: Pay-per-use (pricing varies)
- Monitor usage to avoid unexpected costs

### Mobile App Publishing

- **Apple App Store**: $99/year developer account
- **Google Play Store**: $25 one-time registration

## Support and Resources

- **Expo Documentation**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Railway Docs**: https://docs.railway.app
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Grok API Docs**: https://docs.x.ai

## Next Steps

After successful deployment:

1. **Setup monitoring** for backend uptime and errors
2. **Configure analytics** in mobile app (Expo Analytics, Firebase)
3. **Setup crash reporting** (Sentry, Bugsnag)
4. **Implement rate limiting** on backend
5. **Add request logging** for debugging
6. **Setup CI/CD pipeline** for automated deployments
7. **Create staging environment** for testing before production releases

---

**Security Note:** This deployment guide prioritizes security by keeping API keys server-side. Never commit API keys to git or bundle them in the mobile app. Always use HTTPS for production backends.

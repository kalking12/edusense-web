# Local HTTPS Setup for EduSense Development

## Why HTTPS?

OAuth login requires secure cookies (`Secure` flag). Plain HTTP over a LAN IP won't set these cookies, causing login to fail with "invalid oauth state (403)". This guide sets up local HTTPS with mkcert so you can test the full OAuth flow.

## Step 1: Install mkcert on Windows

### Option A: Using Chocolatey (Recommended)
```powershell
choco install mkcert
```

### Option B: Using Scoop
```powershell
scoop install mkcert
```

### Option C: Manual Download
Download from: https://github.com/FiloSottile/mkcert/releases
Extract to a folder and add to PATH.

## Step 2: Setup Local CA

Run once to install the local certificate authority:
```powershell
mkcert -install
```

This creates a trusted root certificate on your machine. You'll see a Windows security prompt — click "Yes" to trust it.

## Step 3: Generate Certificates for Your LAN IP

Replace `10.198.168.153` with your actual IP from `ipconfig`:

```powershell
cd C:\Users\osinu\Documents\edusense-web
mkcert -key-file certs/key.pem -cert-file certs/cert.pem 10.198.168.153 localhost 127.0.0.1
```

This creates:
- `certs/cert.pem` — Certificate
- `certs/key.pem` — Private key

## Step 4: Update .env

Add these lines to your `.env` file:
```
HTTPS_CERT_PATH=./certs/cert.pem
HTTPS_KEY_PATH=./certs/key.pem
```

## Step 5: Run Dev Server

```powershell
npm run dev
```

The server will now run on HTTPS:
```
✓ Server running on https://localhost:3001/
✓ Network access available at:
  - https://10.198.168.153:3001/
```

## Step 6: Test in Browser

1. Visit: `https://10.198.168.153:3001/`
2. You'll see a browser warning about self-signed cert (expected)
3. Click "Advanced" → "Proceed anyway"
4. Click "Start Processing" to test OAuth login
5. You should now see the Manus login portal

## Troubleshooting

**"Certificate not trusted"**
- Run `mkcert -install` again and restart your browser

**"Connection refused"**
- Check that the dev server is running: `npm run dev`
- Verify your IP address with `ipconfig`

**"Invalid OAuth state"**
- Cookies still not setting? Check browser DevTools → Application → Cookies
- You should see an `oauth_state_*` cookie after clicking login

## Notes

- These certificates are only valid on your local machine
- They expire after ~10 years (mkcert default)
- Never commit `certs/` folder to git (add to `.gitignore`)

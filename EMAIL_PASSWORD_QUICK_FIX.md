# Quick Fix: Enable Magic Link Emails

## The Problem
`EMAIL_SERVER_PASSWORD` is commented out in `.env` → emails not being sent

## The Solution (2 Steps)

### Step 1: Get Gmail App Password
1. Open: https://myaccount.google.com/apppasswords
2. Login with: contact@jointhedragons.com
3. Select: "Mail" + "Windows Computer"
4. Copy the 16-character password

### Step 2: Update .env
Open `/Users/hamdysaad/ELITE/.env` and uncomment line 66:

**BEFORE:**
```env
# EMAIL_SERVER_PASSWORD=a9/9oFc856f9/{(ba
```

**AFTER:**
```env
EMAIL_SERVER_PASSWORD=<your-16-character-password>
```

### Step 3: Restart Server
```bash
npm run dev
```

## Test It
1. Go to: http://localhost:3000/auth/signin
2. Enter test email: test@example.com
3. Check inbox for magic link
4. Click link to verify

---

## If You Don't Have the Password

Check these alternatives:

1. **Look in password manager**
   - Search for "contact@jointhedragons.com"
   - Or "Gmail app password"

2. **Generate new one**
   - Go to https://myaccount.google.com/apppasswords
   - Create new app password
   - Use the 16-character code

3. **Check git history** (if available)
   - The password might be in old commits
   - `git log -p --all -S "EMAIL_SERVER_PASSWORD" -- .env`

4. **Development only** (without emails)
   - Magic link prints to server console
   - Copy/paste URL manually for testing
   - No need for password in dev mode

---

## Development Mode Without Email

If you skip the password, this still works:

**Server Console Output:**
```
🔗 Magic Link (SMTP not configured):
   Email: test@example.com
   Link: http://localhost:3000/api/auth/callback/email?token=abc123&email=test%40example.com
```

**Testing:**
1. Copy the full URL from console
2. Paste into browser
3. User is authenticated

This is fine for local development!

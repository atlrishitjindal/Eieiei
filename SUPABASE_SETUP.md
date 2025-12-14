# Supabase Authentication Setup

To make "Sign in with Google", "Sign in with GitHub", and **Phone/Email OTP** work, you must configure your Supabase project.

## 1. Create a Supabase Project
If you haven't already, create a new project at [database.new](https://database.new).

## 2. Get API Credentials
1. Go to **Project Settings** -> **API**.
2. Copy the `Project URL` and `anon` public key.
3. Create a `.env` file in your project root (if it doesn't exist) and add:

```env
API_KEY=your_gemini_api_key
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

## 3. Enable Social Providers

### Google
1. Go to **Authentication** -> **Providers** -> **Google**.
2. Toggle "Enable Google".
3. Configure Client ID/Secret from Google Cloud Console (Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`).
4. Click **Save**.

### GitHub
1. Go to **Authentication** -> **Providers** -> **GitHub**.
2. Toggle "Enable GitHub".
3. Configure Client ID/Secret from GitHub Developer Settings.
4. Click **Save**.

## 4. Enable Phone & Email OTP (Crucial for this feature)

### Phone (SMS)
1. Go to **Authentication** -> **Providers** -> **Phone**.
2. Toggle "Enable Phone".
3. **SMS Provider**:
   - For testing: You can use the default Supabase provider (limited).
   - For production: Configure **Twilio**, **MessageBird**, or **Vonage** with your API credentials.
4. Click **Save**.

### Email OTP (Codes instead of Links)
To send a 6-digit code to email during sign-up instead of a link:
1. Go to **Authentication** -> **Email Templates**.
2. You can customize the template to say "Your code is {{ .Token }}".
3. **Important**: Using the "Login with Code" feature in the app automatically triggers the OTP flow.

## 5. Restart Development Server
After adding the `.env` variables, restart your terminal/dev server:
```bash
npm run dev
```

# How to Create an OpenAI API Key for Embeddings

This guide will help you create an OpenAI API key needed for the RAG (Retrieval-Augmented Generation) functionality in this chatbot.

## Step-by-Step Instructions

### 1. Visit OpenAI Platform
- Go to [https://platform.openai.com](https://platform.openai.com)
- Click **"Sign Up"** if you don't have an account, or **"Log In"** if you already have one

### 2. Access API Keys Section
- Once logged in, click on your profile icon (top right)
- Select **"API keys"** from the dropdown menu
- Or go directly to: [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)

### 3. Create a New API Key
- Click the **"Create new secret key"** button (or **"+ Create new secret key"**)
- Give it a descriptive name (e.g., "RAG Chatbot Embeddings")
- Click **"Create secret key"**

### 4. Copy Your API Key ⚠️ IMPORTANT
- **Copy the key immediately** - it will only be shown once!
- The key will look something like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- If you lose it, you'll need to create a new one

### 5. Set Up Billing (Required)
- Go to [Billing Settings](https://platform.openai.com/account/billing)
- Add a payment method (credit card or other)
- You'll receive free credits when you sign up, which is usually enough for testing

### 6. Add the Key to Your Project

1. In your project root directory, create a file named `.env.local` (if it doesn't exist)

2. Add your OpenAI API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

3. Replace `sk-proj-your-actual-key-here` with the key you copied

4. **Important**: Never commit `.env.local` to Git (it's already in `.gitignore`)

### 7. Restart Your Development Server
After adding the API key, restart your Next.js development server:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Important Notes

- 🔒 **Security**: Never share your API key publicly or commit it to GitHub
- 💰 **Costs**: OpenAI embeddings are very affordable (around $0.0001 per 1K tokens)
- 🆓 **Free Credits**: New accounts usually get free credits to start
- 📊 **Usage**: You can monitor your usage at [https://platform.openai.com/usage](https://platform.openai.com/usage)

## Troubleshooting

### "OpenAI API key not found" Error
- Make sure `.env.local` exists in the project root (same level as `package.json`)
- Ensure the variable is named exactly `OPENAI_API_KEY`
- Restart your development server after creating/modifying `.env.local`

### "Insufficient credits" Error
- Check your billing at [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)
- Add payment method if needed
- Check usage limits in your account settings

### Still Having Issues?
- Verify the API key is correct (no extra spaces, complete key)
- Check that the key starts with `sk-`
- Ensure you're using the key from the API Keys section (not from other sections)

# SavingsClub — Automated Blog Setup Guide

## What This Does
Every Monday at 9:00 AM Eastern, a script automatically:
1. Picks a finance topic from a rotating list of 52 topics
2. Calls the Claude API to write a 1,000-word SEO-optimized blog post
3. Adds the post to your website
4. Deploys the updated site to Netlify

You don't touch anything. It just works.

---

## What You Need
- ✅ GitHub account (you have this)
- ✅ Netlify account (you have this)
- ✅ Anthropic API key (you have this — the NEW one, not the revoked one)

---

## Step-by-Step Setup

### STEP 1: Create a New GitHub Repository

1. Go to **github.com** and sign in
2. Click the **+** button in the top right → **New repository**
3. Name it: `savingsclub`
4. Set it to **Public** (Netlify free tier needs public repos)
5. Do NOT check "Add a README" — leave it empty
6. Click **Create repository**
7. You'll see a page with setup instructions — keep this page open

### STEP 2: Upload the Project Files

You have two options:

#### Option A: Upload via GitHub Website (Easiest)
1. On your new empty repo page, click **"uploading an existing file"** link
2. Drag ALL these files from the folder I gave you into the upload area:
   - `index.html`
   - `generate-post.js`
   - `generated-posts.json`
   - `package.json`
   - `.gitignore`
   - `.github/workflows/weekly-blog.yml` (you'll need to create the folders)
3. Click **Commit changes**

**Important:** For the `.github/workflows/weekly-blog.yml` file, GitHub's web uploader may not let you create the folder structure. If so, use Option B or:
1. After uploading the other files, click **Add file** → **Create new file**
2. In the filename field, type: `.github/workflows/weekly-blog.yml`
3. Paste the contents of the weekly-blog.yml file
4. Click **Commit changes**

#### Option B: Upload via Command Line
Open a terminal and run these commands one at a time:
```
cd path/to/your/savingsclub-auto/folder
git init
git add -A
git commit -m "Initial SavingsClub setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/savingsclub.git
git push -u origin main
```
Replace `YOUR_USERNAME` with your actual GitHub username.

### STEP 3: Add Your API Key as a GitHub Secret

This is the SECURE way to store your API key:

1. In your GitHub repo, click **Settings** (tab at the top)
2. In the left sidebar, click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Paste your NEW Anthropic API key here
6. Click **Add secret**

Your key is now encrypted. Nobody can see it — not even you after saving.

### STEP 4: Connect GitHub to Netlify

1. Go to **app.netlify.com** and sign in
2. If you have an existing SavingsClub site from drag-and-drop, you can either:
   - Delete it and create a new one, OR
   - Go to **Site settings** → **Build & deploy** → **Link to Git**
3. To create a new connected site:
   - Click **Add new site** → **Import an existing project**
   - Choose **GitHub**
   - Authorize Netlify to access your GitHub if prompted
   - Select your **savingsclub** repository
   - Build settings:
     - **Branch to deploy:** main
     - **Build command:** (leave empty)
     - **Publish directory:** `.` (just a dot)
   - Click **Deploy site**
4. Once deployed, go to **Domain settings** → **Add custom domain**
5. Add `savingsclub.com` and follow the DNS instructions

### STEP 5: Test the Automation

1. In your GitHub repo, click the **Actions** tab
2. You should see "Weekly Blog Post Generator" in the left sidebar
3. Click on it, then click **Run workflow** → **Run workflow** (the green button)
4. Wait 1-2 minutes for it to complete
5. Check your repo — you should see `generated-posts.json` updated with a new post
6. Check your Netlify site — the new post should appear on the blog page

---

## How It Works After Setup

- **Every Monday at 9 AM Eastern**, GitHub Actions runs the script
- The script calls Claude API (~$0.05 per post)
- A new 1,000-word SEO blog post is generated
- The post is added to `generated-posts.json` and `index.html`
- GitHub commits and pushes the changes
- Netlify detects the push and auto-deploys
- Your live site at savingsclub.com shows the new post

**Monthly cost:** Approximately $0.20-$0.50 (4-5 posts per month)

---

## How to Customize

### Change the Schedule
Edit `.github/workflows/weekly-blog.yml` and change the cron line:
- `0 14 * * 1` = Every Monday at 9 AM Eastern (14:00 UTC)
- `0 14 * * 1,4` = Every Monday AND Thursday
- `0 14 * * *` = Every day

### Add New Topics
Edit `generate-post.js` and add topics to the `TOPICS` array.

### Generate a Post Manually
Go to GitHub → Actions → Weekly Blog Post Generator → Run workflow

---

## Troubleshooting

**"API key not set" error in Actions:**
Make sure you named the secret exactly `ANTHROPIC_API_KEY` (all caps, underscores).

**Posts not showing on site:**
Check that Netlify is connected to your GitHub repo and auto-deploy is enabled.

**Want to delete a generated post:**
Edit `generated-posts.json` in GitHub, remove the post entry, and commit.

---

## File Overview

| File | Purpose |
|------|---------|
| `index.html` | Your complete SavingsClub website |
| `generate-post.js` | Script that calls Claude API to write posts |
| `generated-posts.json` | Stores all auto-generated blog posts |
| `package.json` | Project configuration |
| `.github/workflows/weekly-blog.yml` | GitHub Actions schedule |
| `.gitignore` | Tells Git to ignore node_modules |

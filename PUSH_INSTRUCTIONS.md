# How to Push This to GitHub

The profile README repo MUST be named exactly `zeiddata-dev` (matching your GitHub username).
That repo already exists at: https://github.com/zeiddata-dev/zeiddata-dev

## Step 1: Copy this folder somewhere you can find it

Put the `zeiddata-dev-profile` folder somewhere on your machine (Desktop is fine).

## Step 2: Open a terminal in that folder

On Windows: right-click inside the folder → "Open in Terminal" (or open PowerShell and cd to it)

## Step 3: Run these commands

```bash
git init
git add .
git commit -m "feat: animated banner, community buttons, issue templates, snake workflow"
git branch -M main
git remote add origin https://github.com/zeiddata-dev/zeiddata-dev.git
git push -u origin main --force
```

WARNING: The --force flag overwrites whatever is currently in the repo.
If you want to keep the old content as a backup, rename the existing repo first on GitHub
(Settings → rename to zeiddata-dev-old), then push this as zeiddata-dev.

## Step 4: Trigger the snake workflow manually

Go to: https://github.com/zeiddata-dev/zeiddata-dev/actions
Click "Generate Contribution Snake" → "Run workflow"
This creates the SVG files on the output branch. Until it runs, the snake section will show a broken image.

## Step 5: Enable GitHub Discussions on the Research repo

Go to: https://github.com/zeiddata-dev/Research/settings
Scroll to "Features" → check "Discussions" → Save

Then go to Discussions and create these categories:
- Detection Requests
- Ideas
- Q&A
- Show and Tell

## Verification checklist

- [ ] Profile page shows animated typing banner
- [ ] Wave header renders (may take a minute to load from capsule-render.vercel.app)
- [ ] 6 community buttons appear and link correctly
- [ ] GitHub stats cards load
- [ ] Snake animation renders (after workflow runs)
- [ ] Issue templates appear when clicking "New Issue" on Research repo
- [ ] Discussions tab is live on Research repo

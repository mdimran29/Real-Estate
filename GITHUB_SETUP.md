# 🚀 GitHub Setup Guide

## ⚠️ Before Pushing to GitHub

### 1. Verify .env is NOT Being Tracked

```bash
# Check if .env is in .gitignore
cat .gitignore | grep .env

# Make sure .env is NOT staged
git status
```

If `.env` appears in `git status`, remove it:
```bash
git rm --cached .env
```

### 2. Check for Sensitive Data

Run this command to ensure no private keys are in tracked files:
```bash
# Search for potential private keys in tracked files
git ls-files | xargs grep -l "PRIVATE_KEY\|private.*key" | grep -v ".example\|.md\|.gitignore"
```

---

## 📝 First Time Setup

### 1. Initialize Git Repository

```bash
cd /home/imran/Desktop/Real_Estate
git init
```

### 2. Add Remote Repository

```bash
# Replace with your GitHub repository URL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### 3. Create Initial Commit

```bash
# Add all files
git add .

# Create commit
git commit -m "Initial commit: PropToken Real Estate Tokenization System"

# Push to GitHub
git push -u origin main
```

If you get an error about 'master' vs 'main':
```bash
git branch -M main
git push -u origin main
```

---

## 🔐 Security Checklist

Before pushing, verify:

- [ ] `.env` file is in `.gitignore` ✅
- [ ] `.env.example` contains only placeholder values ✅
- [ ] No private keys in any committed files ✅
- [ ] No API keys in any committed files ✅
- [ ] `node_modules/` is in `.gitignore` ✅
- [ ] All sensitive data removed from code ✅

---

## 📂 Files That WILL Be Pushed

✅ **Contracts**
- `contracts/TokenizationManager.sol`
- `contracts/PropertyDeed.sol`
- `contracts/PropertyFractions.sol`

✅ **Tests**
- `test/TokenizationManager.test.js`

✅ **Scripts**
- `scripts/deploy.js`
- `scripts/master-script.js`
- `scripts/verify-fractions.js`

✅ **Documentation**
- `README.md`
- `DEPLOYMENT_SUMMARY.md`
- `FINAL_SUMMARY.md`
- `COMPLETION_CHECKLIST.md`
- `DOCUMENTATION_UPDATE.md`
- `CONTRACT_ADDRESSES.md`

✅ **Configuration**
- `hardhat.config.js`
- `package.json`
- `.gitignore`
- `.env.example` (safe version with placeholders)

---

## 🚫 Files That WILL NOT Be Pushed

❌ **Sensitive Files**
- `.env` (contains your private keys)
- `deployment-info.json` (optional)

❌ **Build Artifacts**
- `node_modules/`
- `cache/`
- `artifacts/`
- `typechain/`

❌ **IDE Files**
- `.vscode/`
- `.idea/`

---

## 🎯 Recommended Git Commands

### Check Status
```bash
git status
```

### View What Will Be Committed
```bash
git diff --cached
```

### Add Specific Files
```bash
git add contracts/
git add test/
git add scripts/
git add *.md
git add package.json
git add hardhat.config.js
git add .gitignore
git add .env.example
```

### Create Commit
```bash
git commit -m "Add PropToken real estate tokenization smart contracts"
```

### Push to GitHub
```bash
git push origin main
```

---

## 📊 After Pushing

### Update README with Deployment Info

Add this badge to your README.md on GitHub:

```markdown
## 🚀 Live Deployment

- **Network**: Sepolia Testnet
- **Status**: ✅ Live & Verified

| Contract | Address |
|----------|---------|
| TokenizationManager | [`0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3`](https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#code) |
| PropertyDeed | [`0xbD88BDF7cB52f972DE2727A7584e38704045eb4C`](https://sepolia.etherscan.io/address/0xbD88BDF7cB52f972DE2727A7584e38704045eb4C#code) |
| PropertyFractions #1 | [`0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0`](https://sepolia.etherscan.io/address/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0#code) |
```

---

## 🔄 For Future Updates

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Your commit message here"

# Push to GitHub
git push origin main
```

---

## 🆘 Common Issues

### Issue: .env was accidentally committed

```bash
# Remove from Git history
git rm --cached .env

# Commit the removal
git commit -m "Remove .env file"

# Push changes
git push origin main
```

### Issue: Need to remove sensitive data from history

If you accidentally committed sensitive data, you need to remove it from Git history:

```bash
# Use BFG Repo-Cleaner or git filter-branch
# Recommended: Use BFG (faster and easier)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Or use git filter-branch (more complex)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## ✅ Final Security Check

Before pushing to GitHub, run:

```bash
# 1. Check git status
git status

# 2. Verify .env is not staged
git ls-files | grep .env

# 3. Search for private keys in staged files
git diff --cached | grep -i "private.*key\|PRIVATE_KEY" || echo "✅ No private keys found"

# 4. View all files that will be pushed
git ls-files
```

---

## 🎉 You're Ready!

Once all checks pass:
1. ✅ `.env` is in `.gitignore` and not tracked
2. ✅ `.env.example` has placeholder values only
3. ✅ No sensitive data in any files
4. ✅ All necessary files are staged

**You're safe to push to GitHub!** 🚀

```bash
git push -u origin main
```

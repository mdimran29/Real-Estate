# Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

### Method 1: Using Vercel CLI

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Build the Project**
```bash
cd frontend
npm run build
```

3. **Deploy**
```bash
vercel --prod
```

### Method 2: Using GitHub Integration

1. **Push to GitHub** (follow instructions in main README)

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Set root directory to `frontend`
   - Add environment variables:
     - `VITE_TOKENIZATION_MANAGER_ADDRESS`
     - `VITE_PROPERTY_DEED_ADDRESS`
     - `VITE_CHAIN_ID`
   - Click "Deploy"

---

## 🌐 Deploy to Netlify

### Method 1: Using Netlify CLI

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Build the Project**
```bash
cd frontend
npm run build
```

3. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

### Method 2: Using GitHub Integration

1. **Push to GitHub**

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Set:
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `frontend/dist`
   - Add environment variables
   - Click "Deploy site"

---

## 📦 Build Configuration

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
```

### Environment Variables

Create `.env.production`:
```env
VITE_TOKENIZATION_MANAGER_ADDRESS=0xcE5938311925624E9FE619cc493AF5eA16bc46E2
VITE_PROPERTY_DEED_ADDRESS=0x414AbAbf01976f66757a3bF3a603adB95b97fDe6
VITE_CHAIN_ID=11155111
```

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Smart contracts deployed and verified
- [ ] Build runs successfully (`npm run build`)
- [ ] No console errors in production build
- [ ] All images load correctly
- [ ] Wallet connection works
- [ ] Transactions execute successfully
- [ ] Mobile responsive
- [ ] Social media links work
- [ ] Footer links functional

---

## 🔧 Troubleshooting

### Build Fails
- Check Node.js version (v16+)
- Delete `node_modules` and reinstall
- Clear build cache: `rm -rf dist`

### Environment Variables Not Working
- Ensure they start with `VITE_`
- Restart dev server after changes
- Check `.env` file is in frontend directory

### Wallet Connection Issues After Deploy
- Verify Chain ID is correct
- Check contract addresses are valid
- Ensure Web3Modal is configured properly

---

## 📊 Performance Tips

1. **Optimize Images**
   - Use WebP format
   - Compress before upload
   - Use Imgur/Cloudinary CDN

2. **Enable Caching**
   - Configure CDN headers
   - Use service workers

3. **Code Splitting**
   - Already handled by Vite
   - Lazy load components if needed

---

## 🎯 Post-Deployment

1. **Test All Features**
   - Connect wallet
   - Browse marketplace
   - Add property (if owner)
   - Buy fractions
   - Check portfolio

2. **Monitor Performance**
   - Check Vercel/Netlify analytics
   - Monitor error logs
   - Track user engagement

3. **Update Documentation**
   - Add live URL to README
   - Update social media
   - Share with community

---

## 🌟 Custom Domain (Optional)

### Vercel
1. Go to project settings
2. Click "Domains"
3. Add your domain
4. Configure DNS records

### Netlify
1. Go to domain settings
2. Add custom domain
3. Follow DNS instructions

---

**Your dApp is ready for the world! 🚀**

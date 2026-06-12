# 🚀 Grade-Check Vault – DEPLOYMENT COMPLETE ✅

Your **Grade-Check Vault** Pokémon card collection app is now **fully deployed and ready to use**.

---

## 📍 Live App

**🌐 Access here:** https://schlaparadoz47-ux.github.io/GRade-cheeck/

Open it in your mobile browser and add to homescreen to use as an app.

---

## ✅ What's Deployed

### Core Features
- ✅ **📦 Collection Manager** – Add, edit, sort, filter cards with PSA grading
- ✅ **📷 Card Search** – TCGdex API integration (German card names)
- ✅ **💰 Grading ROI Calculator** – Auto-compute PSA profitability
- ✅ **⚔️ Arena Battles** – Minigame with your card deck vs. dangers
- ✅ **💾 Full Backup/Restore** – JSON export & import

### Technical Stack
- ✅ **Vite** – Modern build tool, optimized bundle (~30KB gzipped)
- ✅ **Vanilla JS** – No frameworks, fast & lightweight
- ✅ **PWA Ready** – Installable, offline-capable, works anywhere
- ✅ **Service Worker** – Offline caching for images & API responses
- ✅ **GitHub Pages** – Auto-deploys on every push
- ✅ **Capacitor** – Native Android/iOS app ready

---

## 📱 How to Use

### 1. **Open the App**
   ```
   https://schlaparadoz47-ux.github.io/GRade-cheeck/
   ```

### 2. **Install as App** (mobile)
   - **Android Chrome:** Menu → "Install app" or "Add to homescreen"
   - **iOS Safari:** Share → "Add to Home Screen"

### 3. **Start Using**
   - Scan & search cards from TCGdex database
   - Rate condition (1–10 PSA scale)
   - Get instant ROI analysis
   - Battle arena with your collection
   - Export as JSON backup

---

## 🔄 Auto-Deploy on Every Update

**The workflow is already set up.** Whenever you push to `main`:

1. GitHub Actions detects the push
2. Builds with Vite (`npm run build`)
3. Uploads to GitHub Pages
4. ✅ Live updates in 1–2 minutes

**No manual deployment needed.**

---

## 📁 Repository Structure

```
GRade-cheeck/
├── index.html                 # Main UI (Vite entry point)
├── src/
│   └── main.js               # All app logic (Vanilla JS)
├── public/
│   ├── sw.js                 # Service Worker (offline support)
│   └── manifest.webmanifest  # PWA manifest
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions auto-deploy
├── vite.config.js            # Build config
├── capacitor.config.json     # Native app config
├── package.json              # Dependencies
├── README.md                 # Full documentation
├── QUICKSTART.md             # Easy setup guide
└── LICENSE                   # MIT
```

---

## 🛠️ Development

### Run Locally
```bash
git clone https://github.com/schlaparadoz47-ux/GRade-cheeck.git
cd GRade-cheeck
npm install
npm run dev
# → http://localhost:5173
```

### Build for Production
```bash
npm run build
# Creates /dist folder (auto-deployed by GitHub Actions)
```

### Build Native App
```bash
npm run build
npx cap add android
npx cap open android  # Opens Android Studio
```

---

## 🎯 Key Features Explained

### **Collection Manager**
- Add unlimited cards with name, set, number, condition (1–10)
- Track quantity & value per card
- Filter by name/set, sort by newest/value/grade
- Auto-calculates total collection value

### **Card Search (TCGdex)**
- Search by German card name
- Import card data directly from database
- Fallback: manual entry for other TCGs

### **Grading ROI**
- Estimates PSA-10 value based on raw value
- Deducts grading costs (€15 default, changeable)
- Shows profit, ROI %, recommendation
- **Important:** Estimates only – not a guarantee

### **Arena Battles**
- Your card fights against dangers (Knicks, Water damage, etc.)
- Wins/losses tracked
- Streak system
- Fun way to engage with your collection

### **Backup & Restore**
- Export full collection as JSON (includes everything)
- Import from backup or other exports
- Restore at any time

---

## 🔒 Privacy & Data

✅ **All data stays on YOUR device**
- localStorage for browser storage
- No server uploads
- No tracking or analytics
- No accounts needed

---

## 📞 Support & Updates

### Report Issues
→ GitHub Issues on your repo

### Feature Requests
→ GitHub Discussions

### Modify the Code
→ All source is in this repo, easy to edit & extend

### Deploy Updates
→ Push changes to `main`, GitHub Actions does the rest

---

## 🎓 Learning Resources

The app demonstrates:
- **PWA Development** – Manifest, Service Worker, offline caching
- **Vanilla JavaScript** – No frameworks needed for modern apps
- **API Integration** – Fetch, error handling, async/await
- **Local Storage** – IndexedDB-ready architecture
- **Mobile-First Design** – Responsive, touch-optimized CSS
- **Build Tools** – Vite configuration & optimization

Perfect for learning or forking as a template!

---

## ✨ Next Steps

1. **Open the app:** https://schlaparadoz47-ux.github.io/GRade-cheeck/
2. **Add your first card** – Scan or search TCGdex
3. **Test features** – Try ROI calc, Arena, Export
4. **Customize** – Change colors, add features, extend functionality
5. **Share** – Send the link to other collectors!

---

## 🚀 You're Ready to Go!

**Grade-Check Vault is live, fully functional, and ready for your Pokémon card collection.**

No more delays, no server costs, no complexity – just your app, your data, your way.

**Happy collecting!** 🎴✨

---

*Made with 💛 for Pokémon TCG collectors – by collectors, for collectors.*

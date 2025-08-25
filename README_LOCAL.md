# 🏠 Transaction Manager - Local Installation

**Run the Transaction Manager application on your computer without internet connection!**

---

## 🚀 Quick Start (Windows)

### Easiest Method - Double Click to Run!
1. **Double-click `run.bat`** 
2. Wait for setup to complete (first time takes 2-3 minutes)
3. Your browser will open automatically to `http://localhost:7020`
4. Start managing your transactions!

### If Double-Click Doesn't Work
1. Right-click `run.bat` → "Run as administrator"
2. Or open Command Prompt and type: `run.bat`

---

## 🍎 macOS / 🐧 Linux Users

### Quick Start
```bash
# Make script executable (first time only)
chmod +x run.sh

# Run the application
./run.sh
```

### Manual Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📋 What You Need

### Required (Will be installed automatically)
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PNPM** (Package manager) - Installed automatically

### Your Computer Should Have
- **4GB RAM** minimum
- **500MB free space** 
- **Modern browser** (Chrome, Firefox, Edge, Safari)
- **Windows 10/11, macOS, or Linux**

---

## 🔧 How It Works

1. **First Run:** Downloads and installs required components
2. **Starts Server:** Runs local web server on port 7020
3. **Opens Browser:** Automatically opens `http://localhost:7020`
4. **Ready to Use:** Full-featured transaction manager offline!

---

## ✨ Features Available Offline

### 📊 Core Features
- ✅ **Add/Edit/Delete Transactions** - Full transaction management
- ✅ **Customer Database** - Store and manage customer information  
- ✅ **Import Data** - PDF statements, Excel files, JSON backups
- ✅ **Export Reports** - Excel reports, monthly summaries
- ✅ **Automatic Backup** - Every 5 minutes to browser storage
- ✅ **Manual Backup** - Export/import complete data

### ⌨️ Keyboard Shortcuts
- **A** - Add new transaction (when not editing)
- **Enter** - Save changes (when editing)

### 🛡️ Privacy & Security
- **100% Local** - No data sent to internet
- **Your Data Stays** - Everything on your computer
- **No Accounts** - No login required
- **Offline Ready** - Works without internet

---

## 🔍 Troubleshooting

### ❌ "Port 7020 already in use"
**Solution:** Close other programs using port 7020, or:
1. Edit `vite.config.ts` 
2. Change `port: 7020` to `port: 8080` (or any other number)
3. Restart application

### ❌ "Node.js not found"
**Solution:** 
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install it (keep all default settings)
3. Restart your computer
4. Try running again

### ❌ Browser doesn't open automatically
**Solution:**
- Manually open browser and go to: `http://localhost:7020`

### ❌ Application won't start
**Solution:**
1. Delete `node_modules` folder (if exists)
2. Run application again (will reinstall everything)

### ❌ "Permission denied" (macOS/Linux)
**Solution:**
```bash
chmod +x run.sh
sudo ./run.sh
```

---

## 💾 Your Data

### Where is my data stored?
- **Browser Storage** - Automatic saves in your browser
- **Backup Files** - Downloaded to your Downloads folder
- **Location:** All data stays on your computer only

### How to backup my data?
1. Open application
2. Go to "Backup" tab  
3. Click "Export to File"
4. Save the `.json` file somewhere safe

### How to restore my data?
1. Go to "Backup" tab
2. Click "Choose Backup File" 
3. Select your `.json` backup file
4. Data will be restored immediately

---

## 🔄 Updates

### How to update?
1. Download new version
2. Export your data (Backup tab → Export to File)
3. Replace old files with new files
4. Import your data back

### Keep your data safe
- **Export weekly** - Regular backups recommended
- **Multiple locations** - Save backups to USB drive, cloud storage
- **Before updates** - Always backup before updating

---

## 📞 Help & Support

### Self-Help
1. **Check browser console** - Press F12, look for red errors
2. **Restart application** - Close and run again
3. **Clear browser data** - May fix display issues
4. **Try different browser** - Chrome, Firefox, Edge

### Common Solutions
- **Slow performance?** Close other browser tabs
- **Data missing?** Try restoring from auto-backup
- **Can't save?** Check if disk space is full
- **Won't start?** Try running as administrator

---

## 🎯 Tips for Best Experience

### Performance
- **Close unused tabs** in browser
- **Regular backups** - Export data weekly
- **Clear cache** monthly (after backing up)

### Data Management
- **Use meaningful names** for customers
- **Regular exports** for safety
- **Check backup tab** shows current data count

### Workflow Tips
- **Use keyboard shortcuts** for faster entry
- **Auto-balance feature** prevents data entry errors
- **Filter transactions** to find data quickly

---

## 📊 What's Included

```
📁 Transaction Manager/
├── 🚀 run.bat              # Windows quick start
├── 🚀 run.sh               # Mac/Linux quick start  
├── 📚 README_LOCAL.md      # This guide
├── ⚙️ package.json         # Application settings
├── 🌐 client/              # Web application
├── 🔧 server/              # Local server
└── 📋 LOCAL_DEPLOYMENT.md  # Technical details
```

---

## 🌟 Success! You're Ready

Once you see:
```
✅ Server will be available at: http://localhost:7020
✅ Your default browser will open automatically.
```

You're all set! The Transaction Manager is now running locally on your computer.

**Enjoy managing your transactions offline! 🎉**

---

*💡 Tip: Bookmark `http://localhost:7020` for easy access while the server is running.*

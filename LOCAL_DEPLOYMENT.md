# 🚀 Transaction Manager - Local Deployment Guide

## Quick Start (Windows)

### Option 1: One-Click Start
1. **Double-click `run.bat`** - This will automatically:
   - Install Node.js dependencies (if needed)
   - Start the development server on `http://localhost:7020`
   - Open your default browser automatically

### Option 2: Manual Start
1. Open Command Prompt or PowerShell
2. Navigate to the project folder
3. Run the following commands:
   ```bash
   pnpm install    # Install dependencies (first time only)
   pnpm dev        # Start the development server
   ```
4. Open your browser and go to: `http://localhost:7020`

---

## 📋 Prerequisites

### Required Software
- **Node.js** (v16 or higher) - Download from [nodejs.org](https://nodejs.org/)
- **PNPM** - Will be installed automatically by `run.bat`

### System Requirements
- **Windows 10/11** (for .bat file)
- **4GB RAM** minimum
- **100MB free disk space**
- **Modern web browser** (Chrome, Firefox, Edge, Safari)

---

## 🛠️ Manual Setup (All Platforms)

### 1. Install Node.js
```bash
# Verify Node.js installation
node --version    # Should show v16.0.0 or higher
npm --version     # Should show npm version
```

### 2. Install PNPM (if not using run.bat)
```bash
npm install -g pnpm
```

### 3. Install Project Dependencies
```bash
pnpm install
```

### 4. Start Development Server
```bash
pnpm dev
```

### 5. Open Application
- **URL:** `http://localhost:7020`
- **Auto-opens:** Yes (when using run.bat)

---

## 🔧 Configuration

### Port Configuration
- **Default Port:** 7020
- **To change port:** Edit `vite.config.ts` and modify the `port` value
- **Alternative ports:** 3000, 5173, 8080 (if 7020 is busy)

### Environment Setup
- **No environment file needed** for basic operation
- **Data storage:** Browser localStorage (automatic)
- **Backup location:** Downloads folder (when exporting)

---

## 📁 Project Structure
```
transaction-manager/
├── run.bat                 # Windows quick-start script
├── package.json            # Project dependencies
├── vite.config.ts          # Development server config
├── client/                 # Frontend application
│   ├── components/         # React components
│   ├── pages/             # Main pages
│   └── lib/               # Utilities
├── server/                # Backend API
└── shared/                # Shared types
```

---

## 🌟 Features Available Locally

### ✅ Core Features
- **Transaction Management** - Add, edit, delete transactions
- **Customer Database** - Manage customer information
- **Data Import/Export** - PDF, Excel, JSON support
- **Backup System** - Automatic and manual backups
- **Monthly Reports** - Summary and analytics
- **Auto-Balance** - Smart transaction amount handling

### ✅ Keyboard Shortcuts
- **A** - Add new transaction (when not editing)
- **Enter** - Save changes (when editing)
- **Esc** - Cancel editing

### ✅ Data Persistence
- **Auto-save** - Changes saved to browser storage
- **Auto-backup** - Every 5 minutes
- **Export** - Download backups as JSON files
- **Import** - Restore from backup files

---

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
Error: Port 7020 is already in use
```
**Solution:** 
1. Close other applications using port 7020
2. Or edit `vite.config.ts` to use a different port
3. Restart with `pnpm dev`

#### Dependencies Not Installing
```bash
Error: Failed to install dependencies
```
**Solutions:**
1. Delete `node_modules` folder and `pnpm-lock.yaml`
2. Run `pnpm install` again
3. Check internet connection
4. Try using `npm install` instead

#### Browser Not Opening
- **Manual fix:** Open browser and go to `http://localhost:7020`
- **Windows:** Check if default browser is set correctly

#### Application Not Loading
1. **Check console** for error messages (F12 in browser)
2. **Verify server** is running (command prompt should show "ready in...")
3. **Clear browser cache** (Ctrl+F5)
4. **Try incognito mode**

### Getting Help
- **Check browser console** for detailed error messages
- **Verify Node.js version** with `node --version`
- **Restart the application** by closing command prompt and running `run.bat` again

---

## 📊 Data Management

### Backup Locations
- **Auto-backup:** Browser localStorage
- **Manual export:** Downloads folder
- **File format:** JSON (human-readable)

### Import Sources
- **PDF files** - Bank statements
- **Excel files** - Transaction data
- **JSON files** - Previous backups
- **Manual entry** - Direct input

### Data Security
- **Local only** - No data sent to external servers
- **Browser storage** - Encrypted by browser
- **Export control** - You control all backups

---

## 🚀 Performance Tips

### For Best Performance
1. **Close unused browser tabs**
2. **Use latest browser version**
3. **Regular backups** - Export data weekly
4. **Clear browser cache** if sluggish

### Data Limits
- **Transactions:** No hard limit (browser dependent)
- **Customers:** No hard limit
- **File uploads:** 50MB maximum
- **Backup size:** Usually under 1MB

---

## 🔄 Updates and Maintenance

### Updating the Application
1. Download latest version
2. Replace all files except your data exports
3. Run `pnpm install` to update dependencies
4. Import your backed-up data

### Regular Maintenance
- **Weekly backups** recommended
- **Clear browser data** monthly (after exporting)
- **Update Node.js** every 6 months

---

## ⚡ Quick Commands Reference

```bash
# Start application
pnpm dev

# Install dependencies
pnpm install

# Build for production
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

---

## 📞 Support

### Self-Help Resources
1. **Browser console** - Technical error details
2. **This guide** - Common solutions
3. **Backup system** - Restore previous working state

### Application Info
- **Version:** 1.0
- **Port:** 7020
- **Technology:** React + TypeScript + Vite
- **Storage:** Browser localStorage

---

*🎉 Enjoy using your local Transaction Manager! All data stays on your computer for maximum privacy and security.*

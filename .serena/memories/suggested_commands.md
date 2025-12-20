# Suggested Commands

## Development Commands

### Start Development Server (Hot Reload)
```bash
pnpm dev
```
Starts Plasmo dev server with hot reload. Load the extension from `build/chrome-mv3-dev`.

### Build for Production
```bash
pnpm build
```
Creates production build in `build/chrome-mv3-prod`.

## Package Management

### Install Dependencies
```bash
pnpm install
```

### Add a Package
```bash
pnpm add <package-name>
pnpm add -D <dev-package-name>
```

## Git Commands (Windows)
```bash
git status
git add .
git commit -m "message"
git push
git pull
```

## File System Commands (Windows)
```bash
dir                    # List directory
dir /s                 # List recursively
type <file>           # View file contents
cd <path>             # Change directory
mkdir <name>          # Create directory
del <file>            # Delete file
rmdir /s /q <dir>     # Delete directory recursively
```

## Loading Extension in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `build/chrome-mv3-dev` (dev) or `build/chrome-mv3-prod` (prod)

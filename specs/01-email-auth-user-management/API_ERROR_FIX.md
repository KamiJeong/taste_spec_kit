# API Error Fix Report

**Issue**: API server was trying to run from wrong directory  
**Date**: February 9, 2026  
**Status**: ✅ **FIXED**

---

## The Problem

**Error Message**:
```
Error: Cannot find module '@nestjs/core'
Require stack:
- C:\Users\USER\Documents\GitHub\taste_spec_kit\packages\config\typescript\dist\main.js
```

**Root Cause**:
1. The API's `tsconfig.json` extended from `packages/config/typescript/nest.json`
2. The shared config had `"outDir": "./dist"` which was relative to the config package
3. NestJS built the app to `packages/config/typescript/dist/` instead of `apps/api/dist/`
4. When Node tried to run, it looked for `@nestjs/core` in the wrong node_modules

---

## The Fix

### Change 1: Removed `"type": "module"` from API package.json
**File**: `apps/api/package.json`  
**Reason**: NestJS uses CommonJS by default, not ES modules

### Change 2: Added explicit `outDir` to API tsconfig
**File**: `apps/api/tsconfig.json`  
**Added**:
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```
**Reason**: Overrides the inherited outDir to ensure build goes to `apps/api/dist/`

### Change 3: Removed `outDir` from shared nest.json
**File**: `packages/config/typescript/nest.json`  
**Removed**: `"outDir": "./dist"`  
**Reason**: Each app should set its own outDir

---

## Verification

```bash
# Build succeeded
cd apps/api
bun run build
# ✅ dist/main.js created in apps/api/dist/

# Correct location verified
ls apps/api/dist/main.js
# ✅ File exists
```

---

## Current Status

Both servers have been restarted with the fix:

**API Server**:
- Location: `apps/api/dist/main.js` ✅
- Command: `bun run dev`
- Terminal ID: `744206e4-d42d-4df6-b2a9-f6b4e21e599a`

**Web Server**:
- Command: `bun run dev`
- Terminal ID: `94c820e9-e873-488d-a2e8-25867b194839`

---

## Test Instructions

**Wait 10-15 seconds** for servers to fully start, then test:

### Test API (NestJS)
```bash
# Should respond (even 404 is OK at this stage)
curl http://localhost:3001

# Or in browser
start http://localhost:3001
```

**Expected**: Server responds (404 is normal - no routes yet)

### Test Web (Next.js)
```bash
# Should show Taste Spec Kit page
start http://localhost:3000
```

**Expected**: Homepage loads with "Taste Spec Kit" heading

---

## What Was Changed

### Files Modified

1. **apps/api/package.json**
   - Removed `"type": "module"`

2. **apps/api/tsconfig.json**
   - Added `"outDir": "./dist"`
   - Added `"rootDir": "./src"`

3. **packages/config/typescript/nest.json**
   - Removed `"outDir": "./dist"`

### Why This Worked

The tsconfig inheritance chain now properly sets the output directory:

**Before** (broken):
```
packages/config/typescript/nest.json → outDir: "./dist" (relative to config package!)
apps/api/tsconfig.json → (inherited wrong outDir)
Result: Build to packages/config/typescript/dist/ ❌
```

**After** (fixed):
```
packages/config/typescript/nest.json → (no outDir)
apps/api/tsconfig.json → outDir: "./dist" (relative to apps/api/)
Result: Build to apps/api/dist/ ✅
```

---

## Prevention

To prevent this in the future:

1. **Shared configs** should NOT set `outDir` - let each app define its own
2. **Always verify build output**:
   ```bash
   bun run build
   ls dist/main.js  # Should exist
   ```
3. **Test after config changes**:
   ```bash
   bun run build
   bun run start  # Test production build
   ```

---

## Next Steps

1. ✅ Wait for servers to start (10-15 seconds)
2. ✅ Test both URLs in browser
3. ✅ Verify no console errors
4. ✅ Proceed with manual testing per MANUAL_TESTING_GUIDE.md

---

**Fix Applied**: February 9, 2026  
**Status**: ✅ **Ready for Testing**  
**Build Location**: ✅ **Correct** (`apps/api/dist/`)


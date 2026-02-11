# Manual Testing Guide

**Feature**: 이메일 기반 회원가입 및 회원관리  
**Date**: 2026-02-09  
**Purpose**: Manual testing instructions for Phase 2 foundation

---

## 🚀 Development Servers Started

I've started both development servers for you in background processes:

### Running Servers

1. **API Server (NestJS)**
   - URL: http://localhost:3001
   - Filter: `--filter=api`
   - Process: Background terminal

2. **Web Server (Next.js)**
   - URL: http://localhost:3000
   - Filter: `--filter=web`
   - Process: Background terminal

**Wait 10-15 seconds** for both servers to fully start up.

---

## ✅ Testing Checklist

### 1. Frontend Application Test

**URL**: http://localhost:3000

**Expected Results**:
- ✅ Page loads successfully
- ✅ Shows "Taste Spec Kit" heading
- ✅ Shows "Email-based Authentication System" subtitle
- ✅ No console errors in browser DevTools
- ✅ Page is styled with Tailwind CSS

**How to Test**:
```bash
# Open browser
start http://localhost:3000

# Or manually open: http://localhost:3000
```

**Check**:
1. Open browser DevTools (F12)
2. Look for any errors in Console tab
3. Check Network tab - should see Next.js requests
4. Verify page renders properly

---

### 2. API Server Test

**URL**: http://localhost:3001

**Expected Results**:
- ✅ Server responds (may show "Cannot GET /")
- ✅ CORS headers present
- ✅ No startup errors in terminal

**How to Test**:
```bash
# Test API root
curl http://localhost:3001

# Test API v1 endpoint (should return 404 - normal, no routes yet)
curl http://localhost:3001/api/v1/auth/me
```

**Or use browser**:
- Visit: http://localhost:3001
- You should see a response (likely 404 or "Cannot GET /")
- This is NORMAL - we haven't implemented routes yet

---

### 3. Docker Services Test

**PostgreSQL**:
```bash
docker exec -it taste_spec_kit_postgres psql -U kami -d toast -c "SELECT COUNT(*) FROM users;"
```
**Expected**: `0` (table exists but empty)

**Redis**:
```bash
docker exec -it taste_spec_kit_redis redis-cli -a ilovekami PING
```
**Expected**: `PONG`

**Mailhog**:
- Open: http://localhost:8025
- Should see Mailhog web interface
- No emails yet (normal)

---

### 4. Type Safety Test

**In VSCode**:

1. Open `apps/api/src/auth/auth-log.service.ts`
2. Hover over imports - should show type information
3. Try typing `db.` - should show autocomplete
4. No red squiggly lines

**Test in terminal**:
```bash
cd C:\Users\USER\Documents\GitHub\taste_spec_kit
pnpm turbo run type-check
```
**Expected**: ✅ All 10 tasks pass

---

### 5. Hot Reload Test

**Backend (NestJS)**:
1. Edit `apps/api/src/main.ts`
2. Change console log message
3. Save file
4. Watch terminal - should auto-restart

**Frontend (Next.js)**:
1. Edit `apps/web/src/app/page.tsx`
2. Change the heading text
3. Save file
4. Browser should auto-refresh (HMR)

---

### 6. Package Dependencies Test

**Test imports work**:

Create a test file:
```typescript
// apps/api/test-imports.ts
import { db, users } from '@repo/database';
import { UserDTO, SignupDTO } from '@repo/types';
import { signupSchema } from '@repo/validators';

console.log('✅ All imports working!');
console.log('Database:', typeof db);
console.log('Schema:', typeof signupSchema);
```

Run:
```bash
cd apps/api
pnpm run test-imports.ts
```

**Expected**: No errors, logs show object types

---

## 🔍 Things to Check

### In Browser DevTools (F12)

**Console Tab**:
- ✅ No red errors
- ✅ May see Next.js development warnings (normal)
- ✅ May see hydration logs (normal)

**Network Tab**:
- ✅ `/_next/static/...` files loading
- ✅ Status 200 for assets
- ✅ Fast load times

**Application Tab** (Storage):
- Check cookies - may be empty (normal, no auth yet)

---

### In Terminal Output

**API Server Output** (look for):
```
✅ Redis connected
✅ Nest application successfully started
✅ Application is running on: http://localhost:3001
```

**Web Server Output** (look for):
```
✅ Ready in X ms
✅ Local: http://localhost:3000
✅ Compiling / ...
```

---

## 🐛 Common Issues & Solutions

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env
API_PORT=3002
```

### Issue: Database Connection Failed

**Error**: `connect ECONNREFUSED ::1:5432`

**Solution**:
```bash
# Check Docker running
docker ps

# Restart PostgreSQL
docker restart taste_spec_kit_postgres

# Check DATABASE_URL in .env
```

### Issue: TypeScript Errors

**Error**: Module not found

**Solution**:
```bash
# Rebuild packages
pnpm turbo run build --force

# Reinstall dependencies
pnpm install
```

### Issue: Blank Page

**Error**: White screen, no content

**Solution**:
1. Check browser console for errors
2. Hard refresh: Ctrl + Shift + R
3. Clear Next.js cache: `rm -rf apps/web/.next`
4. Rebuild: `pnpm turbo run build --filter=web`

---

## 📊 Success Criteria

Your foundation is working correctly if:

✅ **Frontend loads** at http://localhost:3000  
✅ **No console errors** in browser DevTools  
✅ **API responds** at http://localhost:3001  
✅ **Docker services running** (3 containers)  
✅ **Database tables exist** (4 tables)  
✅ **Type-check passes** (10/10 tasks)  
✅ **Hot reload works** (edit files, see changes)  
✅ **Mailhog accessible** at http://localhost:8025  

---

## 📸 What You Should See

### Frontend (localhost:3000)
```
┌─────────────────────────────────┐
│                                 │
│     Taste Spec Kit              │
│                                 │
│  Email-based Authentication     │
│           System                │
│                                 │
└─────────────────────────────────┘
```
**Styled with Tailwind CSS**

### API (localhost:3001)
```json
{
  "statusCode": 404,
  "message": "Cannot GET /",
  "error": "Not Found"
}
```
**This is NORMAL - no routes implemented yet**

### Mailhog (localhost:8025)
```
Mailhog Web Interface
─────────────────────
Inbox: 0 messages

[ No messages yet ]
```

---

## 🎯 Next Steps After Testing

### If Everything Works ✅

You have three options:

1. **Continue to MVP Implementation**
   - Resume with Phase 3-4 (Signup + Login)
   - 39 tasks remaining for complete auth system

2. **Explore the Codebase**
   - Check `apps/api/src/` - NestJS modules
   - Check `apps/web/src/` - Next.js pages
   - Check `packages/` - Shared code
   - Review generated `dist/` folders

3. **Customize & Extend**
   - Add your own components
   - Modify styling
   - Add new modules

### If Issues Found ❌

1. Check the troubleshooting section above
2. Review terminal output for errors
3. Check Docker containers are running
4. Verify database connection

---

## 💡 Pro Tips

### Development Workflow

```bash
# One terminal for logs
pnpm turbo run dev

# Separate terminal for commands
cd packages/database
pnpm drizzle-kit studio

# Another for testing
curl http://localhost:3001/api/v1/health
```

### VS Code Tips

- Install recommended extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Drizzle ORM

- Use workspace search (Ctrl+Shift+F) to find code
- Use Go to Definition (F12) to navigate types

### Browser Tips

- Keep DevTools open (F12)
- Use React DevTools extension
- Enable "Preserve log" in Console
- Use Network tab to debug API calls

---

## 🎊 Congratulations!

If all tests pass, you have successfully set up a **production-ready monorepo** with:

✅ Turborepo build system  
✅ Type-safe full-stack TypeScript  
✅ Working database with migrations  
✅ Email queue infrastructure  
✅ Hot reload for rapid development  
✅ All services orchestrated with Docker  

**You're ready to build features!** 🚀

---

**Manual Testing Guide**  
**Created**: February 9, 2026  
**Status**: Foundation Ready for Testing

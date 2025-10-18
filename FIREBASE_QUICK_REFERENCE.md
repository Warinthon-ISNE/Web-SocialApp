# 🔥 Firebase Quick Reference Card

## 🚀 Quick Start (TL;DR)

### 1️⃣ Enable Firestore
```
Firebase Console → Firestore Database → Create database → Production mode
```

### 2️⃣ Set Security Rules
```
Firestore Database → Rules → Copy from FIREBASE_MANUAL_SETUP_GUIDE.md → Publish
```

### 3️⃣ Create Indexes
```
Firestore Database → Indexes → Create 4 indexes (see guide)
```

### 4️⃣ Test App
```bash
npm run dev
# Browser: http://localhost:8080/
```

---

## 📚 Collections You'll Have

| Collection | Purpose | Created By |
|------------|---------|------------|
| `activities` | Store all activity posts | App (auto) |
| `activityRequests` | Join requests | App (auto) |
| `profiles` | User profile data | App (auto) |
| `chats` | Chat rooms for activities | App (auto) |
| `chats/{id}/messages` | Messages in each chat | App (auto) |

---

## 🔑 Required Indexes

| Collection | Fields | Type |
|------------|--------|------|
| `activities` | `endedAt` ↑, `createdAt` ↓ | Collection |
| `activityRequests` | `activityId` ↑, `createdAt` ↓ | Collection |
| `activityRequests` | `userId` ↑, `activityId` ↑ | Collection |
| `messages` | `createdAt` ↑ | Collection Group |

---

## 🔒 Who Can Access What?

| Resource | Read | Write | Delete |
|----------|------|-------|--------|
| Activities | All logged in | Host only | Host only |
| Requests | All logged in | Requester | Any |
| Profiles | All logged in | Owner only | Owner only |
| Chats | Participants only | Participants | Host only |
| Messages | Participants only | Sender only | Nobody |

---

## ⚡ Quick Commands

### Restart Dev Server
```bash
Get-Process node | Stop-Process -Force
npm run dev
```

### Hard Refresh Browser
```
Ctrl + Shift + R
```

### Open Incognito
```
Ctrl + Shift + N
```

---

## 🐛 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "permission-denied" | Check rules are published, wait 2 min, refresh |
| "index required" | Click link in error OR create manually |
| Chat not showing | Verify user is host or accepted participant |
| Messages not real-time | Check console, verify user in participants array |

---

## 📞 Helpful Links

- **Firebase Console:** https://console.firebase.google.com/project/see-you-next-time-4fa1b
- **Firestore Rules:** https://console.firebase.google.com/project/see-you-next-time-4fa1b/firestore/rules
- **Firestore Data:** https://console.firebase.google.com/project/see-you-next-time-4fa1b/firestore/data
- **Firestore Indexes:** https://console.firebase.google.com/project/see-you-next-time-4fa1b/firestore/indexes
- **Your App:** http://localhost:8080/

---

## ✅ Setup Checklist

Quick checklist to verify everything is working:

```
□ Firestore enabled
□ Rules published
□ 4 indexes created
□ App runs without errors
□ Can create activity
□ Can send message
□ Messages appear real-time
```

---

**See FIREBASE_MANUAL_SETUP_GUIDE.md for detailed step-by-step instructions!**


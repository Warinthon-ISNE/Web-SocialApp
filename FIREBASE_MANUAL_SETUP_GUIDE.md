# 🔥 Firebase Firestore Manual Setup Guide

## Step-by-Step Guide to Set Up Your Chat Feature

---

## 📋 Prerequisites

- Firebase Project: `see-you-next-time-4fa1b`
- Firebase Console Access: https://console.firebase.google.com/

---

## Part 1: Enable Firestore Database

### Step 1.1: Open Firestore
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **see-you-next-time-4fa1b**
3. Click **"Firestore Database"** in the left sidebar

### Step 1.2: Create Database (if not enabled)
1. If you see **"Create database"** button, click it
2. Choose **"Start in production mode"**
3. Select Cloud Firestore location:
   - Recommended: `us-central1` (US)
   - Or choose closest to your users
4. Click **"Enable"**
5. Wait for database creation (takes 1-2 minutes)

---

## Part 2: Set Up Security Rules

### Step 2.1: Navigate to Rules
1. In Firestore Database, click the **"Rules"** tab at the top
2. You'll see the default rules editor

### Step 2.2: Copy Production Rules
Delete everything and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Activities collection
    match /activities/{activityId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && 
                    request.resource.data.hostId == request.auth.uid;
      allow update: if isSignedIn() && 
                    resource.data.hostId == request.auth.uid;
      allow delete: if isSignedIn() && 
                    resource.data.hostId == request.auth.uid;
    }
    
    // Activity requests
    match /activityRequests/{requestId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && 
                    request.resource.data.userId == request.auth.uid &&
                    request.resource.data.status == "pending";
      allow update: if isSignedIn();
      allow delete: if isSignedIn();
    }
    
    // User profiles
    match /profiles/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isOwner(userId);
      allow update: if isSignedIn() && isOwner(userId);
      allow delete: if isSignedIn() && isOwner(userId);
    }
    
    // Chats - Only participants can access
    match /chats/{chatId} {
      allow read: if isSignedIn() && 
                  request.auth.uid in resource.data.participants;
      allow create: if isSignedIn() && 
                    request.resource.data.hostId == request.auth.uid;
      allow update: if isSignedIn() && 
                    (request.auth.uid == resource.data.hostId ||
                     request.auth.uid in resource.data.participants);
      allow delete: if isSignedIn() && 
                    request.auth.uid == resource.data.hostId;
      
      // Chat messages subcollection
      match /messages/{messageId} {
        allow read: if isSignedIn() && 
                    request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if isSignedIn() && 
                      request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants &&
                      request.resource.data.userId == request.auth.uid;
        allow update, delete: if false;
      }
    }
  }
}
```

### Step 2.3: Publish Rules
1. Click **"Publish"** button (top right)
2. Wait for "Rules published successfully" message
3. ✅ Rules are now live!

---

## Part 3: Manually Create Collections (Optional)

### Step 3.1: Navigate to Data Tab
1. Click **"Data"** tab in Firestore Database
2. You'll see "Start collection" button

### Step 3.2: Create Collections Manually

#### Collection 1: `activities`
1. Click **"Start collection"**
2. Collection ID: `activities`
3. Click **"Next"**
4. For the first document:
   - Document ID: **(Auto-ID)**
   - Add fields:
     ```
     hostId (string): "YOUR_USER_ID_HERE"
     title (string): "Sample Activity"
     description (string): "This is a test activity"
     imageUrl (string): null
     maxParticipants (number): 10
     createdAt (string): "2025-10-18T00:00:00.000Z"
     endedAt (string): null
     ```
5. Click **"Save"**

#### Collection 2: `activityRequests`
1. Click **"Start collection"** (if first collection)
   OR click **"+ Start collection"** in the sidebar
2. Collection ID: `activityRequests`
3. Click **"Next"**
4. For the first document:
   - Document ID: **(Auto-ID)**
   - Add fields:
     ```
     activityId (string): "ACTIVITY_ID_FROM_ABOVE"
     userId (string): "DIFFERENT_USER_ID"
     status (string): "pending"
     createdAt (string): "2025-10-18T00:00:00.000Z"
     ```
5. Click **"Save"**

#### Collection 3: `profiles`
1. Click **"+ Start collection"** in the sidebar
2. Collection ID: `profiles`
3. Click **"Next"**
4. For the first document:
   - Document ID: **Use your actual Firebase Auth User ID**
   - Add fields:
     ```
     name (string): "Your Name"
     username (string): "yourusername"
     email (string): "youremail@seeyounexttime.app"
     birthDate (string): "1990-01-01"
     profileImage (string): null
     createdAt (string): "2025-10-18T00:00:00.000Z"
     ```
5. Click **"Save"**

#### Collection 4: `chats`
1. Click **"+ Start collection"** in the sidebar
2. Collection ID: `chats`
3. Click **"Next"**
4. For the first document:
   - Document ID: **Use same ID as your activity**
   - Add fields:
     ```
     activityId (string): "SAME_AS_DOCUMENT_ID"
     hostId (string): "YOUR_USER_ID"
     participants (array): ["YOUR_USER_ID"]
     createdAt (string): "2025-10-18T00:00:00.000Z"
     ```
5. Click **"Save"**

#### Subcollection: `chats/{chatId}/messages`
1. Click on the chat document you just created
2. Click **"Start collection"** (within the document)
3. Collection ID: `messages`
4. Click **"Next"**
5. For the first message:
   - Document ID: **(Auto-ID)**
   - Add fields:
     ```
     userId (string): "YOUR_USER_ID"
     username (string): "YourUsername"
     message (string): "Hello, this is a test message!"
     createdAt (timestamp): Click the timestamp icon and select current time
     ```
6. Click **"Save"**

---

## Part 4: Create Indexes for Performance

### Step 4.1: Navigate to Indexes Tab
1. Click **"Indexes"** tab in Firestore Database
2. Click **"Create Index"** button

### Index 1: Activities (for Home page query)
1. **Collection ID:** `activities`
2. **Fields to index:**
   - Field path: `endedAt`
     - Query scope: Collection
     - Order: Ascending
   - Field path: `createdAt`
     - Query scope: Collection
     - Order: Descending
3. Click **"Create index"**
4. Wait for "Building" → "Enabled" status (takes 1-5 minutes)

### Index 2: Activity Requests by Activity
1. Click **"Create Index"**
2. **Collection ID:** `activityRequests`
3. **Fields to index:**
   - Field path: `activityId`
     - Query scope: Collection
     - Order: Ascending
   - Field path: `createdAt`
     - Query scope: Collection
     - Order: Descending
4. Click **"Create index"**
5. Wait for "Enabled" status

### Index 3: Activity Requests by User
1. Click **"Create Index"**
2. **Collection ID:** `activityRequests`
3. **Fields to index:**
   - Field path: `userId`
     - Query scope: Collection
     - Order: Ascending
   - Field path: `activityId`
     - Query scope: Collection
     - Order: Ascending
4. Click **"Create index"**
5. Wait for "Enabled" status

### Index 4: Chat Messages (Collection Group)
1. Click **"Create Index"**
2. **Collection ID:** `messages`
3. ⚠️ **Important:** Check "Collection group" checkbox
4. **Fields to index:**
   - Field path: `createdAt`
     - Query scope: Collection group
     - Order: Ascending
5. Click **"Create index"**
6. Wait for "Enabled" status
  
---

## Part 5: Verify Setup

### Step 5.1: Check Rules
- Go to **Rules** tab
- Verify your rules are published
- Look for green checkmark ✓

### Step 5.2: Check Data
- Go to **Data** tab
- Verify you see these collections:
  - ✅ activities
  - ✅ activityRequests
  - ✅ profiles
  - ✅ chats
    - ✅ messages (subcollection inside a chat document)

### Step 5.3: Check Indexes
- Go to **Indexes** tab
- Verify all indexes show "Enabled" status
- Should have 4 indexes total

---

## Part 6: Test Your Application

### Step 6.1: Restart Dev Server
```bash
# Kill all Node processes
Get-Process node | Stop-Process -Force

# Start fresh
npm run dev
```

### Step 6.2: Clear Browser Cache
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Incognito mode (Ctrl + Shift + N)

### Step 6.3: Test Flow
1. ✅ **Login** to your app
2. ✅ **Create a new activity**
   - Should create activity document
   - Should auto-create chat document
3. ✅ **View activity details**
   - Should see activity info
   - Should see "Group Chat" section (for host)
4. ✅ **Send a message**
   - Type and send a message
   - Should appear in real-time
5. ✅ **Test with another user**
   - Login as different user
   - Request to join activity
   - Host accepts request
   - Participant should now see chat
   - Both can send/receive messages

### Step 6.4: Check for Errors
Open browser console (F12) and look for:
- ❌ No red "permission-denied" errors
- ❌ No "index required" errors
- ✅ Messages send successfully
- ✅ Real-time updates work

---

## 🐛 Troubleshooting

### Error: "Missing or insufficient permissions"
**Solution:**
1. Go to Firestore → Rules tab
2. Verify rules are published
3. Wait 1-2 minutes for rules to propagate
4. Hard refresh browser (Ctrl + Shift + R)

### Error: "The query requires an index"
**Solution:**
1. Click the link in the error message (easiest!)
2. Or manually create the index as shown in Part 4
3. Wait for index to build
4. Retry the query

### Chat not showing
**Solution:**
1. Check browser console for errors
2. Verify user is host or accepted participant
3. Check `canAccessChat` state in ActivityDetail
4. Verify chat document exists in Firestore

### Messages not appearing in real-time
**Solution:**
1. Check browser console for errors
2. Verify Firestore security rules allow read access
3. Check that user is in `participants` array
4. Refresh the page

---

## 📊 Database Structure Reference

```
firestore/
├── activities/
│   └── {activityId}/
│       ├── hostId: string
│       ├── title: string
│       ├── description: string | null
│       ├── imageUrl: string | null
│       ├── maxParticipants: number
│       ├── createdAt: string (ISO timestamp)
│       └── endedAt: string | null
│
├── activityRequests/
│   └── {requestId}/
│       ├── activityId: string
│       ├── userId: string
│       ├── status: "pending" | "accepted" | "rejected"
│       └── createdAt: string (ISO timestamp)
│
├── profiles/
│   └── {userId}/
│       ├── name: string
│       ├── username: string
│       ├── email: string
│       ├── birthDate: string
│       ├── profileImage: string | null
│       └── createdAt: string (ISO timestamp)
│
└── chats/
    └── {activityId}/  (same as activity ID)
        ├── activityId: string
        ├── hostId: string
        ├── participants: array of user IDs
        ├── createdAt: string (ISO timestamp)
        └── messages/  (subcollection)
            └── {messageId}/
                ├── userId: string
                ├── username: string
                ├── message: string
                └── createdAt: timestamp (Firestore serverTimestamp)
```

---

## ✅ Completion Checklist

Before considering setup complete, verify:

- [ ] Firestore Database is enabled
- [ ] Security rules are published
- [ ] All 4 collections exist (or will be auto-created)
- [ ] All 4 indexes are created and "Enabled"
- [ ] App runs without permission errors
- [ ] Can create activities
- [ ] Can send messages in chat
- [ ] Messages appear in real-time
- [ ] Only host and accepted participants see chat

---

## 🎉 You're Done!

Once all checkboxes are marked, your Firebase setup is complete and your chat feature is fully functional!

**Need help?** Check the troubleshooting section or review the browser console for specific errors.

---

**Last Updated:** October 18, 2025  
**Firebase Project:** see-you-next-time-4fa1b  
**App Port:** http://localhost:8080/


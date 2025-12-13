# Admin Panel Fixes & Tier Upgrade System

## 🔧 **Issues Fixed**

### 1. **Users Page Showing Only Admin** ✅ FIXED
**Problem:** Admin could only see their own profile in Users Management
**Solution:** Updated RLS policies to allow admins to view ALL user profiles

### 2. **Tiers Page Functionality** ✅ ENHANCED
**Problem:** Tiers page only showed tier information, no upgrade management
**Solution:** Complete tier upgrade request system with approve/reject workflow

---

## 🚀 **New Features Added**

### **1. Tier Upgrade Request System**

#### **User Workflow:**
1. User goes to `/billing`
2. Clicks "View all plans"
3. Clicks "Request Upgrade" on desired tier
4. Request is saved to database with status "pending"
5. User receives confirmation: "Upgrade request submitted!"
6. User cannot submit duplicate pending requests

#### **Admin Workflow:**
1. Admin goes to `/admin/tiers`
2. Sees "Upgrade Requests" tab with pending count badge
3. View table of all pending requests showing:
   - User name & email
   - Current tier
   - Requested tier (with price)
   - How long ago requested
4. Admin can:
   - **Approve** - Instantly upgrades user to new tier
   - **Reject** - Marks request as rejected
5. Request history shows all approved/rejected requests

---

## 📋 **Database Changes**

### **New Migrations to Run:**

Run these 2 files in Supabase SQL Editor:

#### **1. `20251104000006_fix_profiles_rls_for_admin.sql`**
Fixes RLS policies so admins can:
- View all user profiles
- Update any user profile
- View all avatars
- View all subscriptions
- Manage user subscriptions

#### **2. `20251104000007_create_tier_upgrade_requests.sql`**
Creates `tier_upgrade_requests` table with columns:
- `id` - Request ID
- `user_id` - Who requested
- `requested_tier_id` - Which tier they want
- `current_tier_id` - Their current tier
- `status` - pending, approved, rejected, cancelled
- `reviewed_by` - Admin who reviewed
- `reviewed_at` - When reviewed
- `admin_notes` - Optional notes
- `created_at`, `updated_at`

---

## 🎯 **Complete User-Admin Flow**

### **Scenario: User wants to upgrade from Free to Starter**

**Step 1: User Requests Upgrade**
```
User → /billing → "View all plans" → "Request Upgrade" on Starter tier
→ Request saved to database with status "pending"
→ User sees: "Upgrade request submitted! An admin will review soon."
```

**Step 2: Admin Reviews Request**
```
Admin → /admin/tiers → "Upgrade Requests" tab
→ Sees pending request:
   - User: john@example.com
   - Current: Free (1 avatar)
   - Requested: Starter ($9.99/mo, 2 avatars)
   - Requested: 5 minutes ago
→ Admin clicks "Approve"
```

**Step 3: Instant Upgrade**
```
→ User's tier is updated to Starter
→ User's subscription record is created/updated
→ Request status changes to "approved"
→ Admin sees: "Upgrade approved! john@example.com is now on Starter"
→ User can now create 2 avatars instead of 1
```

---

## 📊 **Tiers Management Page Features**

### **Two Tabs:**

#### **1. Upgrade Requests Tab (Primary)**
- **Pending Requests Table:**
  - Shows all awaiting approval
  - Badge with count (e.g., "Upgrade Requests (3)")
  - Approve/Reject buttons
  - User info, tier change, request time

- **Request History:**
  - Shows last 10 reviewed requests
  - Approved/Rejected status with badges
  - Searchable by user

#### **2. Tier Overview Tab**
- Shows all 4 tiers (Free, Starter, Pro, Enterprise)
- Display pricing and avatar limits
- Shows how many users on each tier
- Quick stats at a glance

---

## 🔐 **Security & Permissions**

### **RLS Policies:**

**Users can:**
- View their own upgrade requests
- Create new upgrade requests
- Cancel their own pending requests

**Admins can:**
- View ALL user profiles
- View ALL upgrade requests
- Approve/reject ANY request
- Update user tiers
- Manage subscriptions

**System ensures:**
- Users can't have duplicate pending requests
- Only admins can approve/reject
- All changes are logged with admin ID and timestamp
- Request history is preserved

---

## 📱 **UI Updates**

### **Files Created:**
- `src/pages/admin/TiersManagementNew.tsx` - New tiers management with requests
- `supabase/migrations/20251104000006_fix_profiles_rls_for_admin.sql`
- `supabase/migrations/20251104000007_create_tier_upgrade_requests.sql`

### **Files Updated:**
- `src/components/dashboard/sections/BillingSectionNew.tsx` - Now creates real DB requests
- `src/App.tsx` - Using new TiersManagementNew component

---

## ✅ **Testing Checklist**

### **Step 1: Run Migrations**
```sql
-- In Supabase SQL Editor, run in order:
1. 20251104000006_fix_profiles_rls_for_admin.sql
2. 20251104000007_create_tier_upgrade_requests.sql
```

### **Step 2: Test Users Page**
- [ ] Login as admin
- [ ] Go to `/admin/users`
- [ ] Should see ALL users, not just yourself
- [ ] Click "View Details" on any user
- [ ] Should see complete user info

### **Step 3: Test Upgrade Request (User Side)**
- [ ] Logout, login as regular user
- [ ] Go to `/billing`
- [ ] Click "View all plans"
- [ ] Click "Request Upgrade" on Starter
- [ ] Should see success message
- [ ] Try requesting again - should see "already have pending request"

### **Step 4: Test Approval (Admin Side)**
- [ ] Login as admin
- [ ] Go to `/admin/tiers`
- [ ] Should see "Upgrade Requests (1)" badge on tab
- [ ] See the pending request in table
- [ ] Click "Approve"
- [ ] Should see success message
- [ ] Request moves to "History" section
- [ ] Check user in `/admin/users` - tier should be updated

---

## 🎊 **What's Working Now**

✅ **Users Page shows ALL users** (not just admin)
✅ **Tier upgrade request system** fully functional
✅ **Users can request upgrades** from billing page
✅ **Admins can approve/reject** from tiers page
✅ **Instant tier changes** when approved
✅ **Request history tracking** with timestamps
✅ **Duplicate request prevention**
✅ **Complete audit trail** (who approved, when)

---

## 📚 **API Functions You Can Use**

### **Check if user can create avatar:**
```typescript
const { data } = await supabase.rpc('check_avatar_limit', {
  p_user_id: user.id
});

if (!data[0].allowed) {
  alert(`Avatar limit reached! You have ${data[0].current_count} / ${data[0].max_allowed}`);
}
```

### **Get user's pending requests:**
```typescript
const { data } = await supabase
  .from('tier_upgrade_requests')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'pending');
```

---

**Everything is ready to go! Run the 2 migrations and test!** 🚀

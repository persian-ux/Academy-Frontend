# Admin Dashboard & Manage Users Fix

## Completed
- ✅ **Admin Dashboard Stats** (`src/services/adminService.ts`): Added fallback logic to aggregate stats from individual `/users`, `/courses`, `/tests` endpoints when the dedicated `/dashboard/stats` endpoint fails
- ✅ **User Creation API** (`src/services/userService.ts`): Added `createUser()` function that posts to `/auth/register` with name, email, password, role, and grade_level
- ✅ **Manage Users Page** (`src/pages/admin/ManageUsers.tsx`): 
  - Added "Create User" button in the page header
  - Added modal dialog with form fields: Name, Email, Password, Role (Student/Teacher toggle)
  - When "Student" is selected: shows Grade Level dropdown (8th-12th) and Course selector
  - When "Teacher" is selected: hides grade/course fields
  - Toast notifications for success/error feedback
  - Auto-refreshes user list after creation

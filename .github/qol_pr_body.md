## Quality of Life Improvements

### Sidebar Sync & UX
- Merged floating sync widget into the sidebar on desktop; retained floating widget on mobile
- Added details toggle and sync progress bar in the sidebar

### Greeting & Profile Consistency
- Sidebar/MobileSidebar now prefer Firestore profile name; fallback to displayName or email prefix
- Settings Profile switched to a single “Full Name” field and now persists to Firestore via `updateUserProfile`
- Auth context normalizes name (title-cased email prefix when needed) and hydrates from Firestore

### Accounts Page
- Recent transactions per account limited to 3
- Correct date rendering (UTC) to prevent one-day shift
- Robust sort for recent items: `updatedAt → createdAt → date`
- Wider layout on large screens for readability:
  - Single-column until 2xl
  - Two columns at 2xl

### Transactions Tab
- Display and sorting use UTC-safe epoch to avoid off-by-one issues
- Edit modal uses the same UTC handling
- Fixed Dashboard “Recent Transactions” sorting by ms and dates in UTC
- Fixed Dashboard “View All” to navigate when `onPageChange` isn’t provided

### Themed Date Picker
- New reusable themed `DatePicker` (dark/light)
- Integrated into Add Transaction and Edit Transaction modals
- Smart positioning: anchored to trigger, opens above/below based on space, clamps to viewport with scrolling

## QA Steps
1) Settings → Profile: Save Full Name → Sidebar greets with name
2) Accounts: expand an account → shows latest 3 transactions; dates correct (no day-shift)
3) Transactions: list dates match edit modal dates; sorting by date behaves as expected
4) Add/Edit Transaction: themed date picker attaches to field and never cuts off

## Follow-ups
- Optional: enforce date ranges (e.g., disallow future dates) via DatePicker `min`/`max`

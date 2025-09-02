## Quality of Life Improvements

### Sidebar Sync (Desktop)

- Merged floating sync widget into the sidebar
- Added details toggle and progress bar
- Kept floating sync widget on mobile

### Greeting Consistency

- Sidebar/MobileSidebar prefer Firestore profile name
- Fallback to displayName or email prefix
- Settings uses a single Full Name field and persists to Firestore via auth context

### Accounts Page

- Recent transactions per account limited to 3
- Sort by latest activity (date → updatedAt → createdAt)
- Wider layout on large screens: 2 columns at 2xl breakpoint (more readable)
- Single-column until 2xl to avoid cramped cards

### Transactions Tab

- Display and sorting use UTC-safe epoch to prevent off-by-one day issues
- Edit modal date uses the same UTC handling

### Themed Date Picker

- New reusable DatePicker component (dark/light)
- Integrated into Add Transaction and Edit Transaction
- Smart positioning: anchors to trigger, opens above/below, clamps to viewport and scrolls if needed

## QA Steps

1. Save Full Name in Settings → Sidebar greets with name
2. Accounts → expand an account → shows latest 3 transactions
3. Transactions → dates match the edit modal (no day shift)
4. Add/Edit Transaction → date picker matches theme and never cuts off; opens attached to the field

## Follow-ups

- Optional: enforce date ranges (e.g., no future dates) via DatePicker min/max props

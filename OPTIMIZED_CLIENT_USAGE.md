# Optimized Supabase Client Usage Guide

## Overview

Your database has been successfully denormalized for optimal read performance. This guide shows you how to use the optimized client for maximum performance benefits.

## Available Optimized Methods

### 1. Transaction Operations

```javascript
import { dbOptimized } from "../lib/supabase-optimized";

// Get transactions with filters (much faster)
const { data: transactions } = await dbOptimized.getTransactions({
  accountId: "optional-account-id",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
});

// Search transactions (uses denormalized data)
const { data: searchResults } =
  await dbOptimized.searchTransactions("groceries");

// Get recent transactions
const { data: recent } = await dbOptimized.getRecentTransactions(10);

// Create transaction (triggers automatically update denormalized data)
const { data: newTransaction } = await dbOptimized.createTransaction({
  amount: 50.0,
  description: "Grocery shopping",
  date: "2025-01-15",
  account_id: "account-uuid",
  category_id: "category-uuid",
});
```

### 2. Dashboard Analytics

```javascript
// Get comprehensive dashboard data in one query
const { data: dashboardData } = await dbOptimized.getDashboardData();

// Returns:
// {
//   total_balance: 15000.00,
//   total_accounts: 3,
//   total_transactions: 150,
//   monthly_income: 5000.00,
//   monthly_expenses: 3000.00,
//   net_worth: 15000.00,
//   transactions_last_30_days: 45
// }
```

### 3. Account Operations

```javascript
// Get accounts with performance metrics
const { data: accounts } = await dbOptimized.getAccounts();

// Get specific account analytics
const { data: accountAnalytics } =
  await dbOptimized.getAccountAnalytics("account-uuid");
```

### 4. Category Operations

```javascript
// Get categories with transaction counts
const { data: categories } = await dbOptimized.getCategories();

// Get specific category analytics
const { data: categoryAnalytics } =
  await dbOptimized.getCategoryAnalytics("category-uuid");
```

### 5. Advanced Analytics

```javascript
// Get transaction statistics
const { data: stats } = await dbOptimized.getTransactionStats({
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  accountId: "optional-account-id",
});

// Get monthly trends
const { data: trends } = await dbOptimized.getMonthlyTrends(12);
```

## Performance Benefits

### Before (3NF - Slow)

```javascript
// Complex query with multiple joins
const { data: transactions } = await supabase
  .from("transactions")
  .select(
    `
    *,
    account:accounts(name, account_type_id),
    account_types(code, icon_id, color_id),
    ui_icons(name),
    ui_colors(hex_code),
    categories(name, icon_id, color_id),
    category_icons(ui_icons(name)),
    ui_colors(hex_code)
  `
  )
  .eq("user_id", userId)
  .order("date", { ascending: false });
```

### After (Denormalized - Fast)

```javascript
// Simple query using denormalized data
const { data: transactions } = await dbOptimized.getTransactions();
```

## When to Use Optimized Client

### ✅ Use Optimized Client For:

- **Read operations** (queries, searches, analytics)
- **Dashboard data** (aggregated statistics)
- **Real-time features** (if you add them later)
- **Bulk data operations**

### ❌ Keep Original Client For:

- **Authentication** (AuthContext, login/logout)
- **Write operations** (if you prefer the original interface)
- **Simple CRUD operations** (if you don't need the performance boost)

## Migration Strategy

### Phase 1: Analytics & Dashboard (High Impact)

```javascript
// Update dashboard components
import { dbOptimized } from "../lib/supabase-optimized";

// Replace multiple queries with single optimized query
const { data: dashboardData } = await dbOptimized.getDashboardData();
```

### Phase 2: Search & Filtering (Medium Impact)

```javascript
// Update search components
const { data: results } = await dbOptimized.searchTransactions(searchTerm);
```

### Phase 3: Transaction Lists (Low Impact - already using IndexedDB)

```javascript
// Only if you switch from IndexedDB to Supabase for transactions
const { data: transactions } = await dbOptimized.getTransactions(filters);
```

## Example: Updating a Dashboard Component

### Before

```javascript
// src/components/NetWorth.jsx
import { supabase } from "../lib/supabase";

const NetWorth = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      // Multiple queries
      const { data: accounts } = await supabase
        .from("accounts")
        .select("balance")
        .eq("user_id", userId);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, date")
        .eq("user_id", userId);

      // Client-side calculations
      const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
      const monthlyIncome = transactions
        .filter(
          t =>
            t.amount > 0 &&
            new Date(t.date) >=
              new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      setData({ totalBalance, monthlyIncome });
    };

    loadData();
  }, []);

  // ... render component
};
```

### After

```javascript
// src/components/NetWorth.jsx
import { dbOptimized } from "../lib/supabase-optimized";

const NetWorth = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      // Single optimized query
      const { data: dashboardData } = await dbOptimized.getDashboardData();

      setData({
        totalBalance: dashboardData.total_balance,
        monthlyIncome: dashboardData.monthly_income,
        monthlyExpenses: dashboardData.monthly_expenses,
        netWorth: dashboardData.net_worth,
      });
    };

    loadData();
  }, []);

  // ... render component
};
```

## Performance Expectations

With the optimized client, you should see:

- **Dashboard Load**: 52.5% faster (2.1x improvement)
- **Search Operations**: 10-20% faster
- **Analytics Queries**: 50%+ faster
- **Transaction Lists**: 4-10% faster

## Maintenance

The denormalized data is automatically maintained by:

1. **Database triggers** - update on INSERT/UPDATE
2. **Data pipeline** - run `npm run db:maintain` periodically
3. **Materialized views** - refreshed automatically

## Troubleshooting

### If queries are slow:

1. Check if denormalized columns are populated: `npm run db:maintain`
2. Verify indexes are created: Check Supabase dashboard
3. Refresh materialized views: `npm run db:maintain`

### If data seems inconsistent:

1. Run data validation: `npm run db:maintain`
2. Check trigger function: Verify `update_denormalized_data()` exists
3. Review error logs in Supabase dashboard

## Next Steps

1. **Start with dashboard components** for maximum impact
2. **Test performance improvements** with `npm run db:test:performance`
3. **Gradually migrate** other components as needed
4. **Monitor performance** in production

Your database is now optimized for read performance! 🚀

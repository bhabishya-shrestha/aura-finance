# Plaid Integration Guide

This guide explains how to integrate Plaid's financial data API into your Aura Finance application for secure bank account connectivity.

## Overview

The Plaid integration allows users to:

- Connect their bank accounts securely
- Automatically import transactions
- Track account balances in real-time
- Maintain read-only access to financial data

## Security Features

### 🔒 Bank-Level Security

- **Plaid Link**: Secure OAuth flow for bank authentication
- **Read-Only Access**: No ability to modify accounts or make transactions
- **Encrypted Storage**: Access tokens stored securely in database
- **Row Level Security**: Database-level user isolation
- **Rate Limiting**: Prevents API abuse and respects free tier limits

### 🛡️ Data Protection

- **No Credential Storage**: Bank credentials never stored in our system
- **Token-Based Access**: Uses Plaid access tokens for API calls
- **Automatic Cleanup**: Removes all data when accounts are disconnected
- **Usage Tracking**: Monitors API usage to stay within free tier limits

## Setup Instructions

### 1. Create Plaid Account

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/)
2. Sign up for a free account
3. Navigate to **Team Settings** → **Keys**
4. Copy your **Client ID** and **Secret**

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
# Plaid Configuration
VITE_PLAID_CLIENT_ID=your_plaid_client_id
VITE_PLAID_SECRET=your_plaid_secret_key
VITE_PLAID_ENV=sandbox  # sandbox, development, production
```

### 3. Install Dependencies

```bash
npm install react-plaid-link
```

### 4. Deploy Database Schema

```bash
# Apply the Plaid migration
supabase db push
```

### 5. Test Integration

1. Start your development server
2. Navigate to the bank connection page
3. Test with Plaid's sandbox credentials:
   - **Username**: `user_good`
   - **Password**: `pass_good`

## Free Tier Limits

### 📊 Usage Limits

- **100 Items**: Maximum connected accounts
- **2,000 Transactions**: Per month
- **Rate Limits**: 30 requests per minute per Item

### 🎯 Optimization Strategies

- **Batch Processing**: Import transactions in batches of 500
- **Smart Syncing**: Only sync recent transactions (last 7-30 days)
- **Caching**: Store data locally to reduce API calls
- **Usage Monitoring**: Track usage to prevent limit exceedance

## API Endpoints Used

### Core Endpoints

- `/link/token/create` - Initialize bank connection
- `/item/public_token/exchange` - Exchange tokens
- `/accounts/get` - Retrieve account information
- `/transactions/get` - Fetch transaction data
- `/institutions/get_by_id` - Get institution details

### Rate Limits (Per Minute)

- **Transactions**: 30 requests per Item
- **Accounts**: 15 requests per Item
- **Balances**: 5 requests per Item
- **Institutions**: 50 requests per client

## Usage Examples

### Connect Bank Account

```jsx
import PlaidLink from "./components/PlaidLink";

function ConnectBank() {
  const handleSuccess = (data) => {
    console.log("Connected:", data.institution.name);
    console.log("Accounts:", data.accounts.length);
    console.log("Transactions:", data.transactionsCount);
  };

  return (
    <PlaidLink
      onSuccess={handleSuccess}
      onError={(error) => console.error("Connection failed:", error)}
    />
  );
}
```

### Manage Connected Accounts

```jsx
import ConnectedAccounts from "./components/ConnectedAccounts";

function BankAccounts() {
  const handleRefresh = () => {
    // Refresh your app's data
    loadTransactions();
  };

  return <ConnectedAccounts onRefresh={handleRefresh} />;
}
```

### Sync Transactions

```jsx
import { plaidService, plaidDatabase } from "./services/plaidService";

async function syncTransactions(accessToken, itemId) {
  try {
    // Get recent transactions
    const response = await plaidService.getTransactions(
      accessToken,
      "2024-01-01",
      "2024-01-31",
      { count: 100 }
    );

    // Store in database
    await plaidDatabase.storeTransactions(
      userId,
      itemId,
      response.transactions
    );

    console.log(`Synced ${response.transactions.length} transactions`);
  } catch (error) {
    console.error("Sync failed:", error);
  }
}
```

## Error Handling

### Common Error Codes

| Error Code            | Description                  | Solution                       |
| --------------------- | ---------------------------- | ------------------------------ |
| `RATE_LIMIT_EXCEEDED` | Too many API requests        | Implement exponential backoff  |
| `INVALID_CREDENTIALS` | Bank credentials invalid     | Prompt user to re-authenticate |
| `ITEM_LOGIN_REQUIRED` | Bank requires re-login       | Redirect to Plaid Link         |
| `INSTITUTION_DOWN`    | Bank temporarily unavailable | Retry later with backoff       |

### Error Handling Example

```jsx
try {
  const transactions = await plaidService.getTransactions(
    accessToken,
    startDate,
    endDate
  );
} catch (error) {
  if (error.error_code === "RATE_LIMIT_EXCEEDED") {
    // Wait and retry with exponential backoff
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return await plaidService.getTransactions(accessToken, startDate, endDate);
  } else if (error.error_code === "ITEM_LOGIN_REQUIRED") {
    // Prompt user to reconnect
    showReconnectModal();
  } else {
    // Handle other errors
    showErrorMessage(error.display_message);
  }
}
```

## Database Schema

### Tables Created

#### `plaid_items`

- Stores connected financial institutions
- Contains access tokens and status information

#### `plaid_accounts`

- Stores account information from connected institutions
- Includes balances and account details

#### `plaid_transactions`

- Stores transaction data from connected accounts
- Includes categorization and metadata

#### `plaid_usage`

- Tracks API usage for free tier compliance
- Monitors monthly transaction limits

### Security Policies

All tables have Row Level Security (RLS) enabled:

- Users can only access their own data
- Automatic cleanup on account deletion
- Encrypted storage of sensitive tokens

## Best Practices

### 🔐 Security

- **Never log access tokens** in production
- **Use environment variables** for all secrets
- **Implement proper error handling** to avoid exposing sensitive data
- **Regular security audits** of your implementation

### 📈 Performance

- **Cache frequently accessed data** to reduce API calls
- **Implement pagination** for large transaction sets
- **Use webhooks** for real-time updates (if available)
- **Monitor usage** to stay within free tier limits

### 🧪 Testing

- **Use Plaid's sandbox** for development and testing
- **Test error scenarios** with invalid credentials
- **Mock API responses** for unit tests
- **Test rate limiting** behavior

## Troubleshooting

### Common Issues

#### "Rate limit exceeded"

- **Cause**: Too many API requests
- **Solution**: Implement exponential backoff and reduce request frequency

#### "Item login required"

- **Cause**: Bank credentials expired or invalid
- **Solution**: Prompt user to reconnect through Plaid Link

#### "Institution down"

- **Cause**: Bank's system temporarily unavailable
- **Solution**: Retry with exponential backoff

#### "Invalid credentials"

- **Cause**: Wrong sandbox credentials or bank credentials
- **Solution**: Use correct test credentials or have user re-enter bank credentials

### Debug Mode

Enable debug logging in development:

```jsx
// In your Plaid service
if (import.meta.env.DEV) {
  console.log("Plaid API Request:", { endpoint, data });
}
```

## Production Considerations

### Environment Setup

1. **Switch to Production**: Change `VITE_PLAID_ENV` to `production`
2. **Update Keys**: Use production Client ID and Secret
3. **Test Thoroughly**: Verify all functionality works in production
4. **Monitor Usage**: Set up alerts for approaching free tier limits

### Scaling Considerations

- **Database Indexing**: Ensure proper indexes for performance
- **Caching Strategy**: Implement Redis or similar for frequently accessed data
- **Background Jobs**: Use queues for transaction syncing
- **Monitoring**: Set up logging and monitoring for API usage

## Support Resources

- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid Support](https://support.plaid.com/)
- [Rate Limiting Guide](https://plaid.com/docs/errors/rate-limit-exceeded/)
- [Security Best Practices](https://plaid.com/docs/security/)

## License

This integration follows Plaid's terms of service and security requirements. Ensure compliance with your jurisdiction's financial data regulations.

# Know Your Numbers

A production-ready mobile app for iOS and Android that helps business owners calculate their true overhead and determine the hourly rate they should charge to be profitable.

## Features

- **CSV Import**: Import bank transaction CSVs from any bank
- **Auto-Categorization**: Automatically categorizes expenses with intelligent merchant matching
- **Overhead Analysis**: See your annual and monthly overhead breakdown
- **Hourly Rate Calculator**: Calculate break-even and target hourly rates with profit margins
- **Privacy-First**: All data stored locally on device - no servers, no tracking
- **One-Time Purchase**: Free for up to 100 transactions, one-time unlock for unlimited

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **Navigation**: React Navigation
- **CSV Parsing**: PapaParse
- **In-App Purchases**: react-native-iap

## Project Structure

```
├── src/
│   ├── screens/           # All app screens
│   ├── navigation/        # Navigation configuration
│   ├── database/          # SQLite schema and operations
│   ├── services/          # Business logic (CSV parsing, categorization, overhead calculations)
│   ├── utils/             # Helper functions (date parsing, merchant normalization)
│   ├── constants/         # Categories and seed mappings
│   └── types/             # TypeScript type definitions
├── assets/
│   └── sample-data/       # Sample CSV for demo
├── __tests__/             # Unit tests
└── App.tsx                # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- For iOS development: macOS with Xcode
- For Android development: Android Studio with emulator

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd know-your-numbers
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on your device:
- **iOS**: Press `i` or scan QR code with Expo Go app
- **Android**: Press `a` or scan QR code with Expo Go app
- **Web**: Press `w` (limited functionality)

## Running Tests

Run the unit test suite:

```bash
npm test
```

Tests cover:
- Merchant normalization and deduplication
- Date parsing (multiple formats)
- CSV column mapping detection
- Overhead and hourly rate calculations

## Building for Production

### iOS

1. Configure bundle identifier in `app.json`:
```json
"ios": {
  "bundleIdentifier": "com.knowyournumbers.app"
}
```

2. Build:
```bash
eas build --platform ios
```

3. Set up In-App Purchase in App Store Connect:
   - Create product ID: `com.knowyournumbers.unlock`
   - Set pricing tier ($4.99 or $9.99)
   - Submit for review

### Android

1. Configure package name in `app.json`:
```json
"android": {
  "package": "com.knowyournumbers.app"
}
```

2. Build:
```bash
eas build --platform android
```

3. Set up In-App Purchase in Google Play Console:
   - Create managed product: `com.knowyournumbers.unlock`
   - Set price ($4.99 or $9.99)
   - Activate product

## In-App Purchase Setup

### Product Configuration

The app uses a single one-time purchase product:
- **Product ID**: `com.knowyournumbers.unlock`
- **Type**: Non-consumable (iOS) / Managed product (Android)
- **Pricing**: Configure as $4.99 or $9.99 (or custom amount)

### Implementation Details

- Free tier: Up to 100 transactions total
- Purchase unlocks: Unlimited transactions
- Restore purchases: Supported
- Purchase validation: Client-side (for simplicity; add server-side validation for production)

Update the product ID in `src/services/iap.ts` if needed:
```typescript
export const UNLOCK_PRODUCT_ID = 'com.knowyournumbers.unlock';
```

## Database Schema

The app uses SQLite with the following tables:

### transactions
- id, date, description, merchant_norm, amount_signed, source_file, created_at

### categories
- id, name, include_in_overhead (bool)

### tx_category
- tx_id, category_id, confidence (high|medium|low)

### rules
- id, match_type (contains|exact|regex), pattern, category_id, created_at

### settings
- key, value (includes: onboarding_complete, period_mode, purchase_unlocked)

### imports
- id, filename, imported_at, row_count, deduped_count

## CSV Import

### Supported Formats

The app auto-detects and supports:

**Format A**: Date, Description, Amount
```csv
Date,Description,Amount
2024-01-15,Home Depot,-324.50
```

**Format B**: Date, Description, Debit, Credit
```csv
Date,Payee,Debit,Credit
2024-01-15,Home Depot,324.50,
```

**Format C**: Posted Date, Payee, Outflow, Inflow
```csv
Posted Date,Payee,Outflow,Inflow
01/15/2024,Home Depot,324.50,0.00
```

### Date Formats Supported

- ISO: `2024-01-15`
- US: `01/15/2024` or `1/15/2024`
- EU: `15/01/2024` or `15-01-2024`

### Manual Column Mapping

If headers aren't recognized, the app provides a column mapping screen where users can manually select:
- Date column
- Description column
- Amount column OR Debit + Credit columns

## Categorization

### Default Categories

1. Labor
2. Subcontractors
3. Materials & Supplies
4. Fuel & Vehicle
5. Equipment & Repairs
6. Rent/Facility/Utilities
7. Insurance
8. Marketing & Sales
9. Office/Admin
10. Software & Subscriptions
11. Fees & Interest
12. Taxes & Licenses
13. Meals & Travel
14. Other
15. Excluded (not counted in overhead)

### Auto-Categorization

The app uses a rule-based system with 100+ seed mappings:
1. User-created rules (high confidence)
2. Seed keyword mappings (medium confidence)
3. Default to "Other" (low confidence)

### Exclusions

Automatically excluded from overhead:
- Transfers (internal, to/from savings)
- Credit card payments
- Owner draws/distributions
- Loan principal payments
- Refunds and reversals
- Income/deposits (positive amounts)

## Overhead Calculation

**Formula**:
```
Overhead Total = Sum of expenses in categories where include_in_overhead = true
```

**Period Modes**:
- **Rolling 12 Months**: Based on max transaction date, going back 12 months
- **Last Calendar Year**: Jan 1 - Dec 31 of most recent year in data

**Coverage Warning**: If data doesn't cover full 12 months, a warning is displayed.

## Hourly Rate Calculation

**Formulas**:
```
Total Billable Hours = Employees × Billable Hours per Employee per Year
Overhead per Hour = Overhead Total ÷ Total Billable Hours
Base Rate = Overhead per Hour (+ Labor Cost per Hour if enabled)
Target Rate = Base Rate ÷ (1 - Desired Profit %)
```

**Inputs**:
- Number of employees (default: 1)
- Billable hours per employee per year (default: 1200)
- Desired profit % (default: 15%)
- Optional: Direct labor cost per hour

**Outputs**:
- Overhead per hour
- Base rate (break-even)
- Target rate with profit margin
- Quick reference: 10%, 15%, 20% profit rates

## Sample Data

The app includes a sample CSV with ~100 transactions spanning 12 months. Users can import this during the walkthrough to immediately see the app in action.

Location: `assets/sample-data/sample-transactions.csv`

## First-Run Walkthrough

On first launch, users see a 3-step walkthrough:
1. Import bank CSV
2. Confirm categories
3. See overhead + calculate hourly rate

Includes "Try with sample data" button for instant demo.

The walkthrough can be reset in Settings.

## Privacy & Security

- **No servers**: All processing happens on-device
- **No analytics**: No tracking or data collection by default
- **Local storage**: All data in SQLite database on device
- **No account required**: No login, no registration
- **Offline-first**: Full functionality without internet

## Monetization

- **Free tier**: 100 transactions total
- **One-time purchase**: Unlimited transactions
- **No subscriptions**: Pay once, use forever
- **Restore purchases**: Supported across devices

## Settings

Users can:
- View purchase status
- Restore purchases
- Reset walkthrough
- Reset all data (destructive, with confirmation)
- View app version and privacy info

## Future Enhancements

Potential additions (not in v1):
- PDF export of reports
- Charts and visualizations
- Custom categories
- Multi-currency support
- Profit/loss tracking
- Tax reporting features
- Backup/restore to cloud

## Troubleshooting

### CSV Import Fails

- Ensure CSV is UTF-8 encoded
- Check for proper date format
- Verify column headers are in first row
- Try manual column mapping

### Database Errors

- Try resetting all data in Settings
- Reinstall app if database is corrupted

### Purchase Not Working

- Verify product is set up in App Store Connect / Google Play Console
- Ensure product ID matches in code
- Check device is signed into store account
- Use "Restore Purchases" if previously purchased

## Contributing

This is a production-ready reference implementation. Key areas for contribution:
- Additional bank CSV format support
- More seed categorization mappings
- Improved merchant normalization
- UI/UX enhancements
- Additional test coverage

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check this README
2. Review test files for usage examples
3. Open an issue on GitHub

---

Built with ❤️ for small business owners who need to know their numbers.

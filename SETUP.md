# Setup Guide for Know Your Numbers

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

Then:
- Press `i` for iOS simulator (requires macOS + Xcode)
- Press `a` for Android emulator (requires Android Studio)
- Scan QR code with Expo Go app on your phone

### 3. Try the App

On first launch, you'll see a walkthrough. Click "Try with sample data" to instantly see the app with demo transactions.

## In-App Purchase Configuration

### iOS (App Store Connect)

1. **Create App**
   - Go to App Store Connect
   - Create new app with bundle ID: `com.knowyournumbers.app`

2. **Configure In-App Purchase**
   - Go to Features > In-App Purchases
   - Create new "Non-Consumable" product
   - Product ID: `com.knowyournumbers.unlock`
   - Display Name: "Full Access"
   - Description: "Unlock unlimited transaction imports"
   - Price: Select your tier ($4.99 or $9.99 recommended)
   - Save and submit for review

3. **Sandbox Testing**
   - Create sandbox tester account in App Store Connect
   - Sign in with sandbox account on test device
   - Test purchase flow before production release

### Android (Google Play Console)

1. **Create App**
   - Go to Google Play Console
   - Create new app with package: `com.knowyournumbers.app`

2. **Configure In-App Product**
   - Go to Monetize > Products > In-app products
   - Create new product
   - Product ID: `com.knowyournumbers.unlock`
   - Name: "Full Access"
   - Description: "Unlock unlimited transaction imports"
   - Price: Set your price ($4.99 or $9.99 recommended)
   - Activate the product

3. **License Testing**
   - Add test accounts in Setup > License testing
   - Test purchase flow with test accounts

### Updating Product ID

If you need to change the product ID, update it in:
```typescript
// src/services/iap.ts
export const UNLOCK_PRODUCT_ID = 'com.knowyournumbers.unlock';
```

## Building for Production

### Prerequisites

Install EAS CLI:
```bash
npm install -g eas-cli
```

Login to Expo:
```bash
eas login
```

### iOS Build

1. **Configure**
   - Ensure bundle ID in `app.json` matches App Store Connect
   - Set up signing certificate in EAS

2. **Build**
   ```bash
   eas build --platform ios
   ```

3. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

### Android Build

1. **Configure**
   - Ensure package name in `app.json` matches Play Console
   - Set up signing key in EAS

2. **Build APK (for testing)**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Build AAB (for production)**
   ```bash
   eas build --platform android
   ```

4. **Submit to Play Store**
   ```bash
   eas submit --platform android
   ```

## Testing

### Run Unit Tests

```bash
npm test
```

### Test Coverage

```bash
npm test -- --coverage
```

### Manual Testing Checklist

- [ ] Import sample CSV via walkthrough
- [ ] Import custom CSV file
- [ ] Test column mapping for unrecognized format
- [ ] Review uncategorized merchants
- [ ] Categorize merchant and apply rule
- [ ] Toggle period mode (rolling vs calendar)
- [ ] View overhead dashboard
- [ ] Toggle category include/exclude
- [ ] Calculate hourly rates with different inputs
- [ ] Share report
- [ ] Test in-app purchase (sandbox/test mode)
- [ ] Restore purchases
- [ ] Reset all data
- [ ] Re-show walkthrough from settings

## Database

### Location

SQLite database is stored in app's documents directory:
- iOS: `~/Library/Application Support/Expo/databases/`
- Android: `/data/data/com.knowyournumbers.app/databases/`

### Schema Migrations

Currently using direct SQL in `initDatabase()`. For future versions, consider a migration system.

### Debugging Database

Use SQLite browser or run queries:
```typescript
import { getDatabase } from './src/database';

const db = getDatabase();
const result = await db.getAllAsync('SELECT * FROM transactions LIMIT 10');
console.log(result);
```

## Common Issues

### Expo Go vs Development Build

**Expo Go limitations:**
- In-app purchases won't work (requires dev build)
- SQLite works fine
- CSV import works fine

**When you need a development build:**
- Testing in-app purchases
- Custom native modules
- Production testing

Create development build:
```bash
eas build --profile development --platform ios
```

### CSV Import Not Working

1. Check CSV encoding (must be UTF-8)
2. Verify first row contains headers
3. Check date format is supported
4. Try manual column mapping

### Purchase Not Unlocking

1. Verify product ID matches in code and store
2. Check product is "Active" in store console
3. Use sandbox/test account
4. Try "Restore Purchases"

### Database Errors

1. Check database initialization in App.tsx
2. Verify all migrations ran successfully
3. Use "Reset All Data" in Settings
4. Reinstall app if corrupted

## Development Tips

### Hot Reload

Expo supports fast refresh. Save any file and see changes immediately.

### Debugging

- Shake device to open developer menu
- Use React DevTools
- Check logs: `npx expo start` terminal shows all console.log

### Modifying Categories

Edit `src/constants/categories.ts` to add/remove default categories.

### Adding Seed Mappings

Edit `src/constants/seedMappings.ts` to add more merchant patterns.

### Changing Free Tier Limit

Update limit in `src/services/importService.ts`:
```typescript
if (totalAfterImport > 100) { // Change 100 to your limit
```

## Privacy Compliance

### Data Storage

- All data stored locally (SQLite)
- No remote servers
- No analytics by default

### App Store Privacy Nutrition Labels

**iOS:**
- Data Not Collected: All categories
- No tracking
- No data shared with third parties

**Android:**
- Data safety section: "No data collected"

### GDPR/CCPA Compliance

App is compliant by design:
- No personal data collected
- No data transmission
- User controls all data (can delete)
- No third-party SDKs with tracking

## Support & Maintenance

### Updating Dependencies

```bash
npm update
npx expo install --fix
```

### Monitoring Issues

- Enable crash reporting (optional): Sentry, Bugsnag
- Monitor App Store reviews
- Set up support email in app stores

### Future Enhancements

See README.md for potential features to add.

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native IAP](https://github.com/dooboolab/react-native-iap)
- [SQLite with Expo](https://docs.expo.dev/versions/latest/sdk/sqlite/)

---

Need help? Check the main README.md or open an issue on GitHub.

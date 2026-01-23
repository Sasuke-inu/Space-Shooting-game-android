## [1.5.0] - 2026-01-21

### ✨ Added
- 🎉 **Allergen Filtering with Verified Data**: Set dietary profiles and filter products by allergens with verified data sources, confidence indicators, and last verification dates. Clear disclaimers ensure food safety.
- 🔔 **Shopping List Reminders**: Get notified about active shopping lists at times you choose, so you never forget to shop.
- 🗺️ **Store Locator with Deal Mapping**: Find nearby Woolworths, Coles, and IGA locations on a map. See which stores have the best deals on items in your list and get directions.
- 🎤 **Voice Assistant Integration**: Control your shopping with voice commands like "Add milk to my list" or "What's on sale this week?" Works with Google Assistant.
- 🌱 **Carbon Footprint Tracking**: See the environmental impact of your grocery purchases. Track trends and discover more sustainable alternatives.
- 🍽️ **AI-Powered Meal Suggestions**: Get weekly meal plan recommendations based on your preferences, budget, and current deals. Choose to optimize for cost, nutrition, or variety.
- 📊 **Shopping History & Analytics**: Review spending trends, category breakdowns, and savings achieved over time. Compare spending to previous months.
- 💎 **Digital Loyalty Wallet**: Store and display Woolworths Rewards and Coles flybuys cards as scannable barcodes. Quick access from your home screen and shopping lists.
- 📱 **Deal-Based Recipe Discovery**: Find recipes where key ingredients are on sale. Get ranked by potential savings.
- 📅 **Weekly Meal Plan View**: See all meals across the week in a calendar view. Drag and drop to rearrange and automatically generate your shopping list.
- 🔐 **Enhanced Database Security**: Room database now uses SQLCipher encryption to protect your shopping habits, price alerts, and personal data.
- 📸 **AR Barcode Scanning**: Scan product codes and see price comparisons, deals, and product info directly in your camera view.
- 🔄 **Reliable Offline Mode**: View recently loaded prices, browse shopping lists, and queue actions when offline. Changes sync automatically when you're back online.

### 🔄 Changed
- Profile editor now accessible after initial onboarding so you can update household details and preferences anytime.
- Improved offline-first architecture ensures the app works flawlessly in-store even with poor connectivity.
- Unit pricing ($/kg, $/L, $/100g) now displays prominently and consistently across all retailers for accurate price comparison.

### 🐛 Fixed
- 🔒 **Network Security**: Added SSL certificate pinning to prevent network traffic interception on compromised networks.
- Sort options in product search now show clear touch feedback when tapped.
- Track Price button now uses the correct icon for price alerts.
- SelectableChip and GlassCapsuleButton now display proper touch feedback.
- Dashboard loading improved with parallelized API calls for faster home screen display.
- Product database now includes indexes on frequently searched columns (category, barcode, name) for faster searches as your product cache grows.
- Pull-to-refresh functionality added to product search results.
- Haptic feedback now consistent across all interactive elements including list items, cards, and navigation.
- Shopping lists now persist intelligently when meal plans change, preserving checked items separately.
- Expanded test coverage to cover critical paths and edge cases, ensuring greater app stability.
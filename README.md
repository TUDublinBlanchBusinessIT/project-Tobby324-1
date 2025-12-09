# BorrowBox

BorrowBox is a hyperlocal item-sharing platform that connects neighbours to borrow and lend household items instead of buying. Users can discover nearby listings within a walkable radius, request items for specific dates, coordinate pickup or delivery through in-app chat, document item condition with photos at pickup and return, and build trust through ratings and reviews.

The app serves budget-conscious, space-limited, and sustainability-minded homeowners and renters aged 25-55 in suburban or urban areas, including DIY enthusiasts, party hosts, new parents, hobbyists, and apartment dwellers. It differentiates itself through hyperlocal discovery, borrowing-first interface with availability calendars, duration limits, pickup prompts, deposit options, and a trust model combining reputation scores with timestamped photo documentation.

---

## Core Idea

Help users save money by lending them tools they'll probably use once a year. Why buy a 300 Euro tool to use once, when you can rent it for 10 Euros from a neighbour?

---

## Features Implemented (CA2 Scope)

- **Multiple account types** — Lender, Borrower, or Both roles
- **Responsive mobile UI** via Expo for cross-platform compatibility
- **Firebase Firestore integration** for real-time data synchronization
- **Item listing system** with photos, descriptions, and pricing (Per hour or per day)
- **Availability calendar** for selecting borrowing timeframes
- **Request management** with pending and approved status tracking
- **Profile management** with photo, name, and email display
- **Real-time updates** on request status and item availability
- **Photo upload** for item listings and profile pictures
- **Role-based navigation** with dynamic tab visibility

---

## Screens

### Borrower Screens
- **Homepage** — Browse available items nearby with search and filters
- **Request Page** — View pending and approved borrowing requests
- **Profile Page** — Display picture, name, email, and account settings

### Lender Screens
- **Home Page** — Dashboard showing listed items and activity
- **List Items** — Add new items with photos, pricing, and availability
- **Requests** — Approve or decline incoming borrowing requests
- **Active Loans** — Track currently borrowed items with pickup/return dates

### Hybrid (Both) Screens
- Combined navigation with all Borrower and Lender features
- Unified request management for both lending and borrowing
- Comprehensive profile showing both roles

---

## Tech Stack

- **React Native** — Cross-platform mobile development framework
- **Expo** — Development platform and toolchain
- **Expo Router** — File-based routing for navigation
- **TypeScript** — Type-safe development
- **React Native StyleSheet** — Component styling
- **Expo Vector Icons** — Icon library for UI elements
- **React Native Community Date/Time Picker** — Date and time selection
- **React Native Calendars** — Availability calendar component
- **Firebase & Firestore** — Backend database and authentication
- **Firebase Storage** — Item photos and profile picture storage
- **Expo Image Picker** — Photo capture and selection
- **Expo Location** — Geolocation for hyperlocal discovery

---

## How to Run Locally

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI installed globally
- Firebase project configured with Firestore and Storage enabled

### Installation Steps

1. **Clone the repository:**
```bash
git clone <repository-url>
cd BorrowBox
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Firebase:**
   - Create a `firebaseConfig.ts` file in the `config/` directory
   - Add your Firebase configuration:
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. **Start the development server:**
```bash
npx expo start
```

5. **Run the app:**
   - **iOS:** Press `i` in the terminal or scan QR code with Expo Go app
   - **Android:** Press `a` in the terminal or scan QR code with Expo Go app
   - **Web:** Press `w` in the terminal for web preview

---

## Project Structure
```
BorrowBox/
app/
├── (tabs)/
│   ├── _layout.tsx          # Tab navigation layout
│   ├── index.tsx            # Home/Dashboard (borrower/lender/both)
│   ├── explore.tsx          # Explore items page
│   ├── add-item.tsx         # Add new item (lenders)
│   ├── my-items.tsx         # Manage my items (lenders)
│   ├── requests.tsx         # Borrow requests (borrowers & lenders)
│   └── profile.tsx          # User profile page
├── auth/
│   ├── _layout.tsx          # Auth layout
│   ├── login.tsx            # Login screen
│   └── signup.tsx           # Signup screen
├── _layout.tsx              # Root layout
├── auth-context.tsx         # Authentication context provider
├── item-details.tsx         # Item details & borrow request
└── modal.tsx                # Modal screen

components/
├── ui/
│   ├── collapsible.tsx
│   ├── icon-symbol.tsx
│   └── icon-symbol.ios.tsx
├── external-link.tsx
├── haptic-tab.tsx
├── hello-wave.tsx
├── parallax-scroll-view.tsx
├── themed-text.tsx
└── themed-view.tsx

services/
└── firebase-service.ts      # Firebase Firestore/Storage operations

config/
└── firebase.ts              # Firebase configuration

constants/
└── theme.ts                 # Theme constants

hooks/
├── use-color-scheme.ts
├── use-color-scheme.web.ts
└── use-theme-color.ts

```

---

## Key Functionalities

### Item Listing
- Upload item photos with detailed descriptions
- Set daily/hourly rental pricing
- Define availability calendar with blocked dates
- Specify pickup locations and delivery options
- Set deposit requirements for valuable items

### Request System
- Browse available items with real-time availability
- Submit borrowing requests with preferred dates
- Approve or decline requests as a lender
- Track request status (pending, approved, declined)
- Receive notifications for request updates

### Photo Documentation
- Capture item condition at pickup with timestamp
- Document return condition with comparison photos
- Build trust through transparent condition tracking
- Resolve disputes with photo evidence

### Trust & Safety
- User verification with profile photos
- Rating and review system for both parties
- Reputation scores based on transaction history
- Timestamped photo logs for accountability
- In-app chat for secure communication

---

## User Roles

### Borrower
- Search and browse nearby available items
- Request items for specific dates
- View pending and approved requests
- Rate lenders after successful borrowing
- Build borrowing reputation

### Lender
- List items with photos and pricing
- Manage item availability calendar
- Approve or decline borrowing requests
- Track active loans with pickup/return dates
- Earn income from idle items

### Both (Hybrid)
- Access all features from both roles
- Unified dashboard for lending and borrowing
- Comprehensive transaction history
- Build dual reputation as trusted community member

---

## Future Enhancements (Post-CA2)

- **Geolocation-based discovery** with map view and distance filters
- **In-app chat system** for real-time coordination
- **Push notifications** for requests, pickups, and returns
- **Deposit management** with secure payment integration
- **Insurance options** for high-value items
- **Delivery scheduling** with pickup/dropoff coordination
- **Advanced search filters** by category, price, and distance
- **Community reputation system** with verified badges
- **Dispute resolution workflow** with admin mediation
- **Calendar integration** for automatic scheduling
- **Offline mode** with sync capabilities
- **Multi-language support** for diverse communities

---

## Assignment Context (CA2)

This project was developed as part of a mobile app development assignment (CA2) focusing on:
- **Version control best practices** with structured Git commits
- **Firebase integration** for real-time data management
- **React Native development** with Expo Router
- **TypeScript implementation** for type safety
- **Role-based access control** and dynamic navigation
- **UI/UX design** for mobile-first sharing economy
- **Documentation** of development process and AI usage

---

## License

This project is developed for educational purposes as part of university coursework.

---

## Contact

For questions or feedback regarding this project, please contact the development team through the university assignment portal.
# PayAI Frontend

## Overview
The PayAI frontend is built using Next.js 14 with App Router, TailwindCSS for styling, and Shadcn UI components. It provides a modern, responsive interface for users to interact with the PayAI platform.

## Tech Stack
- Next.js 14
- TailwindCSS
- Shadcn UI
- TypeScript
- Phantom Wallet Integration

## Project Structure
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── offers/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── agents/
│       ├── page.tsx
│       └── [id]/
│           └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── offers/
│   │   ├── OfferCard.tsx
│   │   └── OfferForm.tsx
│   └── wallet/
│       └── ConnectWallet.tsx
├── lib/
│   ├── utils.ts
│   └── api.ts
└── types/
    └── index.ts
```

## Key Features
1. **Home Page**
   - Featured agents
   - Recent offers
   - Quick create offer button

2. **Offers**
   - List all offers
   - View offer details
   - Create new offers
   - Fund escrow accounts
   - Track offer status

3. **Agents**
   - Browse available agents
   - View agent profiles
   - See agent history

## Component Details

### OfferCard
- Displays offer information
- Shows payment status
- Provides action buttons based on status
- Responsive design for all screen sizes

### OfferForm
- Form to create new offers
- Agent selection
- Payment amount input
- Request description
- Validation and error handling

### ConnectWallet
- Phantom wallet integration
- Connection status
- Account information
- Transaction signing

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

3. Run development server:
```bash
npm run dev
```

## Build and Deployment
```bash
npm run build
npm start
```

## Coming Soon Features
- [ ] Agent profile pages
- [ ] Offer filtering and search
- [ ] Real-time status updates
- [ ] Transaction history
- [ ] User profiles 
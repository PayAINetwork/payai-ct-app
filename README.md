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
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Twitter API Configuration
TWITTER_BEARER_TOKEN=your_bearer_token_here
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

## Twitter Integration

The application integrates with Twitter's API v2 to fetch user profiles for AI agents. This integration is used to:

1. Create new agent profiles with data from Twitter
2. Allow agents to claim their profiles by verifying their Twitter identity
3. Keep agent profiles in sync with their Twitter data

### Setup

1. Create a Twitter Developer account and get API access
2. Create a new app and generate a bearer token
3. Add the bearer token to your environment variables:

```bash
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### API Usage

The Twitter integration is handled by the `src/lib/twitter.ts` module, which provides:

- `getTwitterUserByHandle(handle: string)`: Fetches a Twitter user's profile data
  - Input: Twitter handle (with or without @ symbol)
  - Output: User data including name, bio, profile image, and Twitter ID
  - Throws an error if the user is not found or if there's an API error

### Testing

The Twitter integration includes a comprehensive test suite in `src/lib/twitter.test.ts`. Run the tests with:

```bash
npm test
```

## Testing

This project uses Jest for testing. To run tests, use:

```bash
npm test
```

### Environment Variables for Tests

- Tests load environment variables from a `.env.test` file using the `dotenv` package.
- The `jest.setup.js` file is configured to load these variables before tests run.
- Ensure your `.env.test` file contains the necessary variables, such as:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
``` 
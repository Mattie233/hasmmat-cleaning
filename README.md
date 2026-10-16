This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Enquiry delivery setup

Public quote and contact forms submit to the server-side `/api/enquiries` route. It validates the enquiry, sends an internal notification through Resend, then sends the customer a receipt acknowledgement. The acknowledgement explicitly states that no quote or booking has been agreed.

Configure these server-only variables in `.env.local` for local testing and in the hosting provider before a manual deployment:

```env
RESEND_API_KEY=re_your_resend_api_key
ENQUIRY_FROM_EMAIL=quotes@hasmmatcleaning.com
ENQUIRY_NOTIFICATION_TO=hasmmatcleaningservice@gmail.com
ENQUIRY_REPLY_TO=hasmmatcleaningservice@gmail.com
```

Before sending real enquiries, verify `hasmmatcleaning.com` in Resend and ensure `ENQUIRY_REPLY_TO` is a verified, monitored inbox. The sender must remain on the verified `hasmmatcleaning.com` domain. Never use a `NEXT_PUBLIC_` prefix for the API key and never commit real credentials.

If any setting is missing or invalid, the API reports that delivery is unavailable instead of showing success. The route keeps the existing honeypot, Zod validation, request-size cap, per-process rate limit and idempotency protection. For multi-instance hosting, configure a shared-store/edge rate limit as well; the in-memory limiter is per instance.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

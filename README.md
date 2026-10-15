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

Public enquiry forms submit to the server-side `/api/enquiries` route, which forwards validated submissions to Getform. To enable delivery:

1. Create a form in Getform and copy its HTTPS endpoint (`https://getform.io/f/...`).
2. Set `GETFORM_ENDPOINT` in `.env.local` to that endpoint. Do not use a `NEXT_PUBLIC_` prefix or commit the configured value.
3. Restart the development server and submit a test enquiry. The form reports success only after Getform accepts the request.
4. Add the same server-only `GETFORM_ENDPOINT` value to the hosting provider's environment settings before manually deploying. Production environment values are not changed by this repository change.

Without this setting, the API returns a configuration error and the form asks customers to contact the business directly. The route also uses a honeypot, request validation, a per-process rate limit and idempotency keys. For deployments with multiple server instances, add an edge/shared-store rate limit or enable the provider's spam controls; the in-memory limit is per instance.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

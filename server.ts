import express from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import { upsertProductRecord, upsertPriceRecord, upsertSubscription, createOrRetrieveCustomer } from './src/lib/stripe-helpers.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Webhook endpoint must use raw body parser
  app.post('/api/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).send('Webhook secret or signature missing');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'product.created':
        case 'product.updated':
          await upsertProductRecord(event.data.object as Stripe.Product);
          break;
        case 'price.created':
        case 'price.updated':
          await upsertPriceRecord(event.data.object as Stripe.Price);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await upsertSubscription(
            subscription,
            subscription.customer as string,
            event.type === 'customer.subscription.created'
          );
          break;
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          if (checkoutSession.mode === 'subscription') {
            const subscriptionId = checkoutSession.subscription;
            await upsertSubscription(
              await stripe.subscriptions.retrieve(subscriptionId as string),
              checkoutSession.customer as string,
              true
            );
          }
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).send('Webhook handler failed');
    }

    res.json({ received: true });
  });

  // Regular JSON parser for other endpoints
  app.use(express.json());

  app.post('/api/create-checkout', async (req, res) => {
    try {
      const { priceId, userId, email } = req.body;
      
      if (!priceId || !userId) {
        return res.status(400).json({ error: 'Missing priceId or userId' });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured in environment variables.');
      }

      // Check for mock IDs from the SQL script
      if (priceId.includes('monthly') && !priceId.startsWith('price_1')) {
        console.warn(`Attempting to use a potentially mock priceId: ${priceId}`);
      }

      const customerId = await createOrRetrieveCustomer({
        uuid: userId,
        email: email || ''
      });

      const getBaseUrl = () => {
        if (process.env.APP_URL) return process.env.APP_URL;
        const protocol = req.get('host')?.includes('localhost') ? 'http' : 'https';
        return `${protocol}://${req.get('host')}`;
      };

      const baseUrl = getBaseUrl();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        customer: customerId,
        client_reference_id: userId,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            supabase_user_id: userId
          }
        },
        success_url: `${baseUrl}/dashboard`,
        cancel_url: `${baseUrl}/pricing`
      });

      if (!session.url) {
        throw new Error('Failed to generate Stripe checkout URL.');
      }

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      
      // Provide more helpful messages for common Stripe errors
      let message = error.message;
      if (message.includes('No such price')) {
        message = `O ID do preço (${req.body.priceId}) não foi encontrado no Stripe. Certifique-se de que você criou o produto e o preço no seu Dashboard do Stripe e atualizou o banco de dados com o ID real (que começa com 'price_').`;
      } else if (message.includes('apiKey')) {
        message = 'A chave secreta do Stripe (STRIPE_SECRET_KEY) é inválida ou não foi configurada.';
      }
      
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const upsertProductRecord = async (product: Stripe.Product) => {
  const productData = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin.from('products').upsert([productData]);
  if (error) throw error;
  console.log(`Product inserted/updated: ${product.id}`);
};

export const upsertPriceRecord = async (price: Stripe.Price) => {
  const priceData = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : price.product.id,
    active: price.active,
    currency: price.currency,
    unit_amount: price.unit_amount ?? 0,
    type: price.type,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin.from('prices').upsert([priceData]);
  if (error) throw error;
  console.log(`Price inserted/updated: ${price.id}`);
};

export const createOrRetrieveCustomer = async ({
  email,
  uuid
}: {
  email: string;
  uuid: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('user_id', uuid)
    .maybeSingle();

  if (error) throw error;

  if (data?.stripe_customer_id) {
    return data.stripe_customer_id;
  }

  const customerData: Stripe.CustomerCreateParams = {
    metadata: {
      supabase_user_id: uuid
    }
  };
  if (email) customerData.email = email;

  const customer = await stripe.customers.create(customerData);

  const { error: supabaseError } = await supabaseAdmin.from('customers').insert([{
    user_id: uuid,
    stripe_customer_id: customer.id
  }]);

  if (supabaseError) throw supabaseError;
  console.log(`New customer created and mapped for user: ${uuid}`);
  return customer.id;
};

const toDateTime = (secs: number) => {
  var t = new Date('1970-01-01T00:00:00Z');
  t.setSeconds(secs);
  return t.toISOString();
};

export const upsertSubscription = async (
  subscription: Stripe.Subscription,
  customerId: string,
  isCreateAction = false
) => {
  const { data: customerData, error: noCustomerError } = await supabaseAdmin
    .from('customers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (noCustomerError) throw noCustomerError;

  const { user_id: uuid } = customerData;

  const subscriptionData = {
    id: subscription.id,
    user_id: uuid,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    created: toDateTime(subscription.created),
    current_period_start: toDateTime(subscription.current_period_start),
    current_period_end: toDateTime(subscription.current_period_end),
    ended_at: subscription.ended_at ? toDateTime(subscription.ended_at) : null,
    cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at) : null,
    canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at) : null,
    trial_start: subscription.trial_start ? toDateTime(subscription.trial_start) : null,
    trial_end: subscription.trial_end ? toDateTime(subscription.trial_end) : null,
    metadata: subscription.metadata,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin.from('subscriptions').upsert([subscriptionData]);
  if (error) throw error;
  console.log(`Subscription ${isCreateAction ? 'created' : 'updated'} for user: ${uuid}`);
};

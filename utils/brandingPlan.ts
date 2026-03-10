export type PlanId = 'starter' | 'professional' | 'enterprise';

const normalizePlanId = (value?: string): PlanId => {
  const plan = String(value || '').trim().toLowerCase();
  if (plan === 'pro') return 'professional';
  if (plan === 'free') return 'starter';
  if (plan === 'professional' || plan === 'enterprise' || plan === 'starter') {
    return plan;
  }
  return 'starter';
};

export const resolvePlanId = (plan?: string, status?: string): PlanId => {
  const subscriptionStatus = String(status || '').trim().toLowerCase();
  if (subscriptionStatus === 'expired') return 'starter';
  return normalizePlanId(plan);
};

export const shouldShowWatermark = (subscription?: { plan?: string; status?: string }) =>
  resolvePlanId(subscription?.plan, subscription?.status) === 'starter';

export const getWatermarkText = (subscription?: { plan?: string; status?: string }) =>
  shouldShowWatermark(subscription) ? 'Powered by Ledgerly' : '';

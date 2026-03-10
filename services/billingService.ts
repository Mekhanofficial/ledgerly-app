import { apiGet, apiPost, apiPut } from './apiClient';

export const fetchBillingSummary = async () => {
  const response = await apiGet('/api/v1/billing/summary');
  return response;
};

export const updateSubscription = async (payload: { plan: string; billingCycle: 'monthly' | 'yearly' }) => {
  const response = await apiPut('/api/v1/billing/subscription', payload);
  return response;
};

export const initializeSubscriptionPayment = async (payload: { plan: string; billingCycle: 'monthly' | 'yearly' }) => {
  const response = await apiPost('/api/v1/payments/initialize-subscription', payload);
  return response;
};

export const initializePublicSubscriptionPayment = async (payload: {
  plan: string;
  billingCycle: 'monthly' | 'yearly';
  email: string;
}) => {
  const response = await apiPost('/api/v1/payments/initialize-public-subscription', payload);
  return response;
};

export const initializeTemplatePayment = async (payload: {
  templateId?: string;
  type?: 'template' | 'bundle' | 'lifetime';
  bundleTier?: 'premium' | 'elite' | 'all';
  tier?: 'premium' | 'elite' | 'all';
}) => {
  const response = await apiPost('/api/v1/payments/initialize-template', payload);
  return response;
};

export const verifyPayment = async (reference: string) => {
  const response = await apiGet(`/api/v1/payments/verify/${reference}`);
  return response;
};

export const updateAddOns = async (payload: {
  whiteLabelEnabled: boolean;
  extraSeats: number;
  analyticsEnabled: boolean;
}) => {
  const response = await apiPut('/api/v1/billing/addons', payload);
  return response;
};

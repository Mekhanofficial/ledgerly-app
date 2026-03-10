import { apiGet, apiPut } from './apiClient';

export type IntegrationProviderId =
  | 'stripe'
  | 'paypal'
  | 'paystack'
  | 'email'
  | 'quickbooks'
  | 'xero'
  | 'wave'
  | 'zapier'
  | 'whatsapp'
  | 'sms'
  | 'restApi';

export interface IntegrationsConfig {
  stripe: {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  paypal: {
    enabled: boolean;
    clientId: string;
    secret: string;
    mode: 'sandbox' | 'live';
  };
  paystack: {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
  };
  email: {
    enabled: boolean;
    provider: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  };
  quickbooks: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
  };
  xero: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
  };
  wave: {
    enabled: boolean;
    apiKey: string;
  };
  zapier: {
    enabled: boolean;
    webhookUrl: string;
  };
  whatsapp: {
    enabled: boolean;
    apiKey: string;
    senderId: string;
  };
  sms: {
    enabled: boolean;
    provider: string;
    apiKey: string;
    senderId: string;
  };
  restApi: {
    enabled: boolean;
    keyRotationDays: number;
    webhookBaseUrl: string;
  };
}

export const DEFAULT_INTEGRATIONS: IntegrationsConfig = {
  stripe: { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' },
  paypal: { enabled: false, clientId: '', secret: '', mode: 'sandbox' },
  paystack: { enabled: false, publicKey: '', secretKey: '' },
  email: { enabled: false, provider: 'smtp', host: '', port: 587, secure: false, username: '', password: '' },
  quickbooks: { enabled: false, clientId: '', clientSecret: '' },
  xero: { enabled: false, clientId: '', clientSecret: '' },
  wave: { enabled: false, apiKey: '' },
  zapier: { enabled: false, webhookUrl: '' },
  whatsapp: { enabled: false, apiKey: '', senderId: '' },
  sms: { enabled: false, provider: '', apiKey: '', senderId: '' },
  restApi: { enabled: true, keyRotationDays: 90, webhookBaseUrl: '' },
};

const isPlainObject = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const mergeDeep = (base: Record<string, any>, override?: Record<string, any>): Record<string, any> => {
  const result = deepClone(base) as Record<string, any>;
  if (!isPlainObject(override)) return result;

  Object.entries(override).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeDeep(result[key], value);
      return;
    }
    result[key] = value;
  });

  return result;
};

export const normalizeIntegrations = (integrations?: Partial<IntegrationsConfig> | null): IntegrationsConfig =>
  mergeDeep(DEFAULT_INTEGRATIONS, integrations as Record<string, any>) as IntegrationsConfig;

export const fetchSettings = async () => {
  const response: any = await apiGet('/settings');
  return response?.data ?? response ?? {};
};

export const fetchIntegrations = async (): Promise<IntegrationsConfig> => {
  const settings = await fetchSettings();
  return normalizeIntegrations(settings?.integrations);
};

export const updateIntegration = async (
  provider: IntegrationProviderId,
  payload: Record<string, any>
) => {
  const response: any = await apiPut(`/settings/integrations/${provider}`, payload);
  return response?.data ?? response ?? {};
};

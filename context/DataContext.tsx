// contexts/DataContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL } from '@/services/apiClient';
import { useUser } from '@/context/UserContext';
import {
  INVOICE_TEMPLATE_KEY,
  RECEIPT_TEMPLATE_KEY,
  INVOICE_TEMPLATE_STYLE_MAP_KEY,
  RECEIPT_TEMPLATE_STYLE_MAP_KEY,
} from '@/services/storageKeys';
import { getBuiltInTemplates, mergeTemplates } from '@/utils/templateCatalog';
import { initializeTemplatePayment } from '@/services/billingService';
import { formatCurrency, resolveCurrencyCode } from '@/utils/currency';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  productCount?: number;
  totalValue?: number;
  isActive?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  outstanding: number;
  totalSpent: number;
  lastTransaction: string;
  status: 'active' | 'inactive';
  notes?: string;
  invoices?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  quantity: number;
  lowStockThreshold: number;
  category: string;
  categoryId?: string;
  description: string;
  supplier: string;
  supplierId?: string;
  barcode: string;
  tags: string[];
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  createdAt: string;
  updatedAt: string;
  image?: string;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceRecurring {
  isRecurring: boolean;
  status?: 'active' | 'paused' | 'completed';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval?: number;
  startDate?: string;
  endDate?: string;
  nextInvoiceDate?: string;
  totalCycles?: number;
  completedCycles?: number;
}

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  customerId?: string;
  customerEmail: string;
  customerPhone: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  subtotal?: number;
  taxAmount?: number;
  taxRateUsed?: number;
  taxName?: string;
  isTaxOverridden?: boolean;
  paidAmount: number;
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes: string;
  recurring?: InvoiceRecurring;
  templateStyle?: string;
  inventoryAdjusted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Receipt {
  id: string;
  number: string;
  customer: string;
  customerId?: string;
  customerEmail: string;
  customerPhone: string;
  time: string;
  amount: number;
  subtotal: number;
  tax: number;
  taxName?: string;
  taxRateUsed?: number;
  taxAmount?: number;
  isTaxOverridden?: boolean;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mobile';
  templateStyle?: string;
  status: 'completed' | 'refunded' | 'pending';
  items: ReceiptItem[];
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaxSettings {
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  allowManualOverride: boolean;
}

export interface DashboardStats {
  totalRevenue: number;
  outstandingPayments: number;
  lowStockItems: number;
  totalInvoices: number;
  totalPaid: number;
  totalCustomers: number;
  activeCustomers: number;
  overdueInvoices: number;
  totalReceipts: number;
  todayReceipts: number;
  receiptsRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  revenueChange: string;
  invoiceChange: string;
  customerChange: string;
  averageInvoiceValue: number;
  paymentCollectionRate: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'payment' | 'invoice';
  title: string;
  message: string;
  time: string;
  read: boolean;
  action?: {
    label: string;
    route: string;
  };
  createdAt: Date;
  priority?: 'high' | 'medium' | 'low';
  dataId?: string;
}

export interface TemplateColors {
  primary?: number[];
  secondary?: number[];
  accent?: number[];
  text?: number[];
  border?: number[];
}

export interface TemplateFonts {
  title?: string;
  body?: string;
  accent?: string;
}

export interface TemplateLayout {
  showLogo?: boolean;
  showWatermark?: boolean;
  watermarkText?: string;
  showHeaderBorder?: boolean;
  showFooter?: boolean;
  hasAnimations?: boolean;
  hasGradientEffects?: boolean;
  hasMultiLanguage?: boolean;
  hasBackgroundPattern?: boolean;
  hasDarkMode?: boolean;
  hasDataTables?: boolean;
  hasInteractiveElements?: boolean;
  hasPremiumTypography?: boolean;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isPremium?: boolean;
  isDefault?: boolean;
  isFavorite?: boolean;
  hasAccess?: boolean;
  price?: number;
  previewColor?: string;
  templateStyle?: string;
  colors?: TemplateColors;
  fonts?: TemplateFonts;
  layout?: TemplateLayout;
  lineItems?: any[];
  notes?: string;
  terms?: string;
  emailSubject?: string;
  emailMessage?: string;
  currency?: string;
  paymentTerms?: string;
  createdAt?: string;
}

const mapTemplateRecord = (template: any): Template => ({
  id: template.id || template._id || template.templateId,
  name: template.name || 'Template',
  description: template.description,
  category: template.category,
  isPremium: template.isPremium,
  isDefault: template.isDefault,
  isFavorite: template.isFavorite,
  hasAccess: template.hasAccess ?? !template.isPremium,
  price: template.price,
  previewColor: template.previewColor,
  templateStyle: template.templateStyle || template.id,
  colors: template.colors,
  fonts: template.fonts,
  layout: template.layout,
  lineItems: template.lineItems,
  notes: template.notes,
  terms: template.terms,
  emailSubject: template.emailSubject,
  emailMessage: template.emailMessage,
  currency: template.currency,
  paymentTerms: template.paymentTerms,
  createdAt: template.createdAt,
});

interface DataContextType {
  invoices: Invoice[];
  inventory: Product[];
  customers: Customer[];
  receipts: Receipt[];
  categories: Category[];
  dashboardStats: DashboardStats;
  loading: boolean;
  notifications: Notification[];
  templates: Template[];
  selectedInvoiceTemplate: Template | null;
  selectedReceiptTemplate: Template | null;
  taxSettings: TaxSettings;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;

  createCategory: (name: string) => Promise<string>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => Promise<string>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  recordPayment: (invoiceId: string, amount: number, paymentMethod?: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoices: () => Invoice[];

  createProduct: (productData: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (id: string, quantity: number, type: 'add' | 'remove' | 'set') => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProducts: () => Product[];

  createCustomer: (
    customerData: Omit<Customer, 'id' | 'outstanding' | 'totalSpent' | 'lastTransaction' | 'invoices' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomers: () => Customer[];

  createReceipt: (receiptData: Omit<Receipt, 'id' | 'number' | 'createdAt'>) => Promise<string>;
  addReceipt: (receiptData: Omit<Receipt, 'id' | 'number' | 'createdAt'>) => Promise<string>;
  updateReceipt: (id: string, updates: Partial<Receipt>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  getReceiptById: (id: string) => Receipt | undefined;
  getReceipts: () => Receipt[];

  refreshData: () => Promise<void>;
  searchData: (query: string, type: 'all' | 'invoices' | 'customers' | 'products' | 'receipts') => any[];
  generateNotificationsFromData: () => void;

  refreshTemplates: () => Promise<void>;
  setInvoiceTemplate: (templateId: string) => Promise<void>;
  setReceiptTemplate: (templateId: string) => Promise<void>;
  purchaseTemplate: (templateId: string) => Promise<void>;
  refreshTaxSettings: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

const formatAddress = (address: any) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.street, address.city, address.state, address.country, address.postalCode]
    .filter(Boolean)
    .join(', ');
};

const normalizeDateString = (value?: string | Date) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const normalizePaymentMethod = (method?: string): Receipt['paymentMethod'] => {
  const value = (method || '').toLowerCase();
  if (value.includes('card')) return 'card';
  if (value.includes('transfer') || value.includes('bank')) return 'transfer';
  if (value.includes('mobile') || value.includes('wallet')) return 'mobile';
  if (value.includes('cash')) return 'cash';
  return 'cash';
};

const mapInvoiceStatusFromApi = (status?: string): Invoice['status'] => {
  if (!status) return 'draft';
  switch (status) {
    case 'partial':
    case 'sent':
    case 'viewed':
      return 'pending';
    case 'void':
      return 'cancelled';
    default:
      return status as Invoice['status'];
  }
};

const mapInvoiceStatusToApi = (status?: Invoice['status']) => {
  if (!status) return undefined;
  if (status === 'pending') return 'sent';
  if (status === 'cancelled') return 'cancelled';
  return status;
};

const isDataUri = (value?: string) => Boolean(value && value.startsWith('data:image/'));

const isLocalImageUri = (value?: string) =>
  Boolean(
    value &&
      (value.startsWith('file://') || value.startsWith('content://') || value.startsWith('ph://'))
  );

const getImageMimeType = (uri: string) => {
  const clean = uri.split('?')[0] || uri;
  const parts = clean.split('.');
  const ext = parts[parts.length - 1]?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
    case 'heif':
      return 'image/heic';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
};

const resolveImageDataUri = async (uri?: string) => {
  if (!uri) return undefined;
  if (uri.startsWith('http') || isDataUri(uri)) {
    return uri;
  }
  if (!isLocalImageUri(uri)) {
    return uri;
  }
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const mimeType = getImageMimeType(uri);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to read image data:', error);
    return undefined;
  }
};

const resolveMediaUrl = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${normalized}`;
};

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useUser();
  const currencyCode = resolveCurrencyCode(user || undefined);
  const formatMoney = useCallback(
    (value: number, options = {}) => formatCurrency(value, currencyCode, options),
    [currencyCode]
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<Template[]>(() =>
    getBuiltInTemplates().map(mapTemplateRecord)
  );
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    taxEnabled: true,
    taxName: 'VAT',
    taxRate: 7.5,
    allowManualOverride: true,
  });
  const [invoiceTemplateId, setInvoiceTemplateId] = useState<string | null>(() => {
    const builtIns = getBuiltInTemplates();
    return builtIns.find((template) => template.isDefault)?.id || builtIns[0]?.id || null;
  });
  const [receiptTemplateId, setReceiptTemplateId] = useState<string | null>(() => {
    const builtIns = getBuiltInTemplates();
    return builtIns.find((template) => template.isDefault)?.id || builtIns[0]?.id || null;
  });
  const [invoiceTemplateStyleMap, setInvoiceTemplateStyleMap] = useState<Record<string, string>>({});
  const [receiptTemplateStyleMap, setReceiptTemplateStyleMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const templateSelectionLock = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadTemplateStyleMaps = async () => {
      try {
        const [invoiceStyleMapRaw, receiptStyleMapRaw] = await Promise.all([
          AsyncStorage.getItem(INVOICE_TEMPLATE_STYLE_MAP_KEY),
          AsyncStorage.getItem(RECEIPT_TEMPLATE_STYLE_MAP_KEY),
        ]);
        if (!mounted) return;

        const parsedInvoiceMap = invoiceStyleMapRaw ? JSON.parse(invoiceStyleMapRaw) : {};
        const parsedReceiptMap = receiptStyleMapRaw ? JSON.parse(receiptStyleMapRaw) : {};

        setInvoiceTemplateStyleMap(
          parsedInvoiceMap && typeof parsedInvoiceMap === 'object' ? parsedInvoiceMap : {}
        );
        setReceiptTemplateStyleMap(
          parsedReceiptMap && typeof parsedReceiptMap === 'object' ? parsedReceiptMap : {}
        );
      } catch (error) {
        console.error('Failed to load template style maps:', error);
      }
    };

    loadTemplateStyleMaps();

    return () => {
      mounted = false;
    };
  }, []);

  const mapCategory = useCallback((category: any): Category => ({
    id: category._id || category.id,
    name: category.name,
    description: category.description,
    color: category.color,
    icon: category.icon,
    productCount: category.productCount,
    totalValue: category.totalValue,
    isActive: category.isActive,
  }), []);

  const mapSupplier = useCallback((supplier: any): Supplier => ({
    id: supplier._id || supplier.id,
    name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    isActive: supplier.isActive,
  }), []);

  const mapTemplate = useCallback(mapTemplateRecord, []);

  const mapCustomer = useCallback((customer: any): Customer => ({
    id: customer._id || customer.id,
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || customer.mobile || '',
    company: customer.company || '',
    address: formatAddress(customer.address),
    outstanding: customer.outstandingBalance ?? customer.outstanding ?? 0,
    totalSpent: customer.totalSpent ?? 0,
    lastTransaction:
      customer.lastPurchaseDate ||
      customer.updatedAt ||
      customer.createdAt ||
      new Date().toISOString(),
    status: customer.isActive === false ? 'inactive' : 'active',
    notes: customer.notes,
    invoices: [],
    createdAt: customer.createdAt || new Date().toISOString(),
    updatedAt: customer.updatedAt,
  }), []);

  const mapProduct = useCallback((product: any): Product => {
    const stock = product.stock || {};
    const available = stock.available ?? stock.quantity ?? 0;
    const lowStockThreshold = stock.lowStockThreshold ?? 0;
    const status =
      available <= 0
        ? 'out-of-stock'
        : available <= lowStockThreshold
        ? 'low-stock'
        : 'in-stock';

    return {
      id: product._id || product.id,
      name: product.name || '',
      sku: product.sku || '',
      price: product.sellingPrice ?? product.price ?? 0,
      costPrice: product.costPrice ?? 0,
      quantity: available,
      lowStockThreshold,
      category: product.category?.name || product.categoryName || '',
      categoryId: product.category?._id || product.category,
      description: product.description || '',
      supplier: product.supplier?.name || '',
      supplierId: product.supplier?._id || product.supplier,
      barcode: product.barcode || '',
      tags: product.tags || [],
      status,
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: product.updatedAt || product.createdAt || new Date().toISOString(),
      image: resolveMediaUrl(
        product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url
      ),
    };
  }, []);

  const mapInvoice = useCallback((invoice: any): Invoice => {
    const customer = typeof invoice.customer === 'object' ? invoice.customer : null;
    const resolvedId = invoice._id || invoice.id;
    return {
      id: resolvedId,
      number: invoice.invoiceNumber || invoice.number || '',
      customer: customer?.name || invoice.customerName || '',
      customerId: customer?._id || invoice.customer,
      customerEmail: customer?.email || invoice.customerEmail || '',
      customerPhone: customer?.phone || invoice.customerPhone || '',
      issueDate: invoice.date || invoice.issueDate || invoice.createdAt || new Date().toISOString(),
      dueDate: invoice.dueDate || invoice.createdAt || new Date().toISOString(),
      amount: invoice.total ?? invoice.amount ?? 0,
      subtotal: invoice.subtotal ?? 0,
      taxAmount: invoice.taxAmount ?? invoice.tax?.amount ?? 0,
      taxRateUsed: invoice.taxRateUsed ?? invoice.tax?.percentage ?? 0,
      taxName: invoice.taxName || invoice.tax?.description || 'Tax',
      isTaxOverridden: Boolean(invoice.isTaxOverridden),
      paidAmount: invoice.amountPaid ?? invoice.paidAmount ?? 0,
      status: mapInvoiceStatusFromApi(invoice.status),
      items: (invoice.items || []).map((item: any, index: number) => ({
        id: item._id || item.id || `${invoice._id}-${index}`,
        productId: item.product?._id || item.product || item.productId,
        description: item.description || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
      })),
      notes: invoice.notes || '',
      recurring: invoice.recurring
        ? {
            isRecurring: Boolean(invoice.recurring.isRecurring),
            status: invoice.recurring.status,
            frequency: invoice.recurring.frequency,
            interval: invoice.recurring.interval,
            startDate: normalizeDateString(invoice.recurring.startDate),
            endDate: normalizeDateString(invoice.recurring.endDate),
            nextInvoiceDate: normalizeDateString(invoice.recurring.nextInvoiceDate),
            totalCycles: invoice.recurring.totalCycles,
            completedCycles: invoice.recurring.completedCycles,
          }
        : undefined,
      templateStyle:
        invoice.templateStyle ||
        invoice.templateId ||
        invoice.template ||
        (resolvedId ? invoiceTemplateStyleMap[resolvedId] : undefined),
      createdAt: invoice.createdAt || new Date().toISOString(),
      updatedAt: invoice.updatedAt,
    };
  }, [invoiceTemplateStyleMap]);

  const mapReceipt = useCallback((receipt: any): Receipt => {
    const customer = typeof receipt.customer === 'object' ? receipt.customer : null;
    const resolvedId = receipt._id || receipt.id;
    return {
      id: resolvedId,
      number: receipt.receiptNumber || receipt.number || '',
      customer: customer?.name || receipt.customerName || '',
      customerId: customer?._id || receipt.customer,
      customerEmail: customer?.email || receipt.customerEmail || '',
      customerPhone: customer?.phone || receipt.customerPhone || '',
      time: receipt.date || receipt.time || receipt.createdAt || new Date().toISOString(),
      amount: receipt.total ?? receipt.amount ?? 0,
      subtotal: receipt.subtotal ?? 0,
      tax: receipt.taxAmount ?? receipt.tax?.amount ?? receipt.tax ?? 0,
      taxAmount: receipt.taxAmount ?? receipt.tax?.amount ?? receipt.tax ?? 0,
      taxRateUsed: receipt.taxRateUsed ?? receipt.tax?.percentage ?? 0,
      taxName: receipt.taxName || receipt.tax?.description || 'Tax',
      isTaxOverridden: Boolean(receipt.isTaxOverridden),
      discount: receipt.discount?.amount ?? receipt.discount ?? 0,
      paymentMethod: normalizePaymentMethod(receipt.paymentMethod),
      templateStyle: receipt.templateStyle || (resolvedId ? receiptTemplateStyleMap[resolvedId] : undefined),
      status: receipt.isVoid ? 'refunded' : receipt.status || 'completed',
      items: (receipt.items || []).map((item: any, index: number) => ({
        id: item._id || item.id || `${receipt._id}-${index}`,
        name: item.description || item.name || 'Item',
        quantity: item.quantity || 0,
        price: item.unitPrice ?? item.price ?? 0,
      })),
      notes: receipt.notes || '',
      createdAt: receipt.createdAt || new Date().toISOString(),
      updatedAt: receipt.updatedAt,
    };
  }, [receiptTemplateStyleMap]);

  const applyTemplateSelection = useCallback(async (templatesList: Template[]) => {
    if (!templatesList.length) {
      setInvoiceTemplateId((prev) => (prev === null ? prev : null));
      setReceiptTemplateId((prev) => (prev === null ? prev : null));
      return;
    }
    if (templateSelectionLock.current) return;
    templateSelectionLock.current = true;

    try {
      const defaultTemplateId =
        templatesList.find((template) => template.isDefault)?.id || templatesList[0].id;

      const [storedInvoiceId, storedReceiptId] = await Promise.all([
        AsyncStorage.getItem(INVOICE_TEMPLATE_KEY),
        AsyncStorage.getItem(RECEIPT_TEMPLATE_KEY),
      ]);

      const resolvedInvoiceId =
        storedInvoiceId && templatesList.some((template) => template.id === storedInvoiceId)
          ? storedInvoiceId
          : defaultTemplateId;
      const resolvedReceiptId =
        storedReceiptId && templatesList.some((template) => template.id === storedReceiptId)
          ? storedReceiptId
          : defaultTemplateId;

      setInvoiceTemplateId((prev) => (prev === resolvedInvoiceId ? prev : resolvedInvoiceId));
      setReceiptTemplateId((prev) => (prev === resolvedReceiptId ? prev : resolvedReceiptId));

      if (resolvedInvoiceId && resolvedInvoiceId !== storedInvoiceId) {
        await AsyncStorage.setItem(INVOICE_TEMPLATE_KEY, resolvedInvoiceId);
      }
      if (resolvedReceiptId && resolvedReceiptId !== storedReceiptId) {
        await AsyncStorage.setItem(RECEIPT_TEMPLATE_KEY, resolvedReceiptId);
      }
    } finally {
      templateSelectionLock.current = false;
    }
  }, []);

  const loadFallbackTemplates = useCallback(async () => {
    try {
      const fallbackTemplates = await mergeTemplates([]);
      const mappedTemplates = fallbackTemplates.map(mapTemplate);
      setTemplates(mappedTemplates);
      await applyTemplateSelection(mappedTemplates);
      return;
    } catch (error) {
      console.error('Failed to load fallback templates:', error);
    }

    const localTemplates = getBuiltInTemplates().map(mapTemplateRecord);
    setTemplates(localTemplates);
    await applyTemplateSelection(localTemplates);
  }, [applyTemplateSelection, mapTemplate]);

  const refreshTaxSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response: any = await apiGet('/api/v1/tax-settings');
      const data = response?.data ?? response;
      if (!data) return;
      setTaxSettings({
        taxEnabled: data.taxEnabled ?? true,
        taxName: data.taxName || 'VAT',
        taxRate: Number(data.taxRate) || 0,
        allowManualOverride: data.allowManualOverride ?? true,
      });
    } catch (error) {
      console.error('Failed to load tax settings:', error);
    }
  }, [isAuthenticated]);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const unwrapList = (payload: any) => {
        if (!payload) return [];
        const data = payload.data ?? payload;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.items)) return data.items;
        return [];
      };

      const fetchAllPages = async (
        path: string,
        params: Record<string, any> = {},
        pageSize = 200
      ) => {
        const limit = params.limit ?? pageSize;
        let page = params.page ?? 1;
        let combined: any[] = [];
        let resolvedPages = 1;

        for (let guard = 0; guard < 200; guard += 1) {
          const payload: any = await apiGet(path, { ...params, page, limit });
          const data = unwrapList(payload);
          combined = combined.concat(data);

          const hasPagination = payload?.pages !== undefined || payload?.total !== undefined;
          if (!hasPagination) {
            return combined;
          }

          resolvedPages = payload?.pages ?? Math.ceil((payload?.total ?? combined.length) / limit);
          if (data.length === 0 || page >= resolvedPages) {
            return combined;
          }

          page += 1;
        }

        return combined;
      };

      const requests = [
        { key: 'categories', call: fetchAllPages('/api/v1/categories', {}, 200) },
        { key: 'suppliers', call: fetchAllPages('/api/v1/suppliers', {}, 200) },
        { key: 'customers', call: fetchAllPages('/api/v1/customers', {}, 200) },
        { key: 'products', call: fetchAllPages('/api/v1/products', {}, 200) },
        { key: 'invoices', call: fetchAllPages('/api/v1/invoices', {}, 200) },
        { key: 'receipts', call: fetchAllPages('/api/v1/receipts', {}, 200) },
        { key: 'templates', call: apiGet('/api/v1/templates') },
      ];

      const results = await Promise.allSettled(requests.map((req) => req.call));

      const readList = (index: number) => {
        const result = results[index];
        if (result?.status === 'fulfilled') {
          return Array.isArray(result.value) ? result.value : unwrapList(result.value);
        }
        console.error(`Failed to load ${requests[index]?.key}:`, result?.reason);
        return [];
      };

      const categoriesData = readList(0);
      const suppliersData = readList(1);
      const customersData = readList(2);
      const productsData = readList(3);
      const invoicesData = readList(4);
      const receiptsData = readList(5);
      const templatesPayload =
        results[6]?.status === 'fulfilled' ? results[6].value : null;

      setCategories(categoriesData.map(mapCategory));
      setSuppliers(suppliersData.map(mapSupplier));
      setCustomers(customersData.map(mapCustomer));
      setInventory(productsData.map(mapProduct));
      setInvoices(invoicesData.map(mapInvoice));
      setReceipts(receiptsData.map(mapReceipt));

      if (templatesPayload) {
        const templatesData = unwrapList(templatesPayload);
        const mergedTemplates = await mergeTemplates(templatesData);
        const mappedTemplates = mergedTemplates.map(mapTemplate);
        setTemplates(mappedTemplates);
        await applyTemplateSelection(mappedTemplates);
      } else {
        await loadFallbackTemplates();
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      await loadFallbackTemplates();
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    mapCategory,
    mapSupplier,
    mapCustomer,
    mapProduct,
    mapInvoice,
    mapReceipt,
    mapTemplate,
    applyTemplateSelection,
    mergeTemplates,
    loadFallbackTemplates,
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      refreshTaxSettings();
    }
  }, [isAuthenticated, refreshData, refreshTaxSettings]);

  useEffect(() => {
    if (isAuthenticated) return;
    setInvoices([]);
    setInventory([]);
    setCustomers([]);
    setReceipts([]);
    setCategories([]);
    setSuppliers([]);
    setNotifications([]);
    setInvoiceTemplateStyleMap((prev) => (Object.keys(prev).length ? {} : prev));
    setReceiptTemplateStyleMap((prev) => (Object.keys(prev).length ? {} : prev));
    const fallbackTemplates = getBuiltInTemplates().map(mapTemplateRecord);
    setTemplates(fallbackTemplates);
    void applyTemplateSelection(fallbackTemplates);
  }, [isAuthenticated, applyTemplateSelection]);

  const saveInvoiceTemplateStyle = useCallback(async (invoiceId?: string, templateStyle?: string) => {
    if (!invoiceId || !templateStyle) return;
    setInvoiceTemplateStyleMap((prev) => {
      if (prev[invoiceId] === templateStyle) return prev;
      const next = { ...prev, [invoiceId]: templateStyle };
      AsyncStorage.setItem(INVOICE_TEMPLATE_STYLE_MAP_KEY, JSON.stringify(next)).catch((error) => {
        console.error('Failed to persist invoice template style map:', error);
      });
      return next;
    });
  }, []);

  const saveReceiptTemplateStyle = useCallback(async (receiptId?: string, templateStyle?: string) => {
    if (!receiptId || !templateStyle) return;
    setReceiptTemplateStyleMap((prev) => {
      if (prev[receiptId] === templateStyle) return prev;
      const next = { ...prev, [receiptId]: templateStyle };
      AsyncStorage.setItem(RECEIPT_TEMPLATE_STYLE_MAP_KEY, JSON.stringify(next)).catch((error) => {
        console.error('Failed to persist receipt template style map:', error);
      });
      return next;
    });
  }, []);

  const getDashboardStats = useCallback((): DashboardStats => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now);
    const duration = Math.max(0, periodEnd.getTime() - periodStart.getTime());
    const previousEnd = new Date(periodStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    const resolveInvoiceDate = (inv: Invoice) => {
      const raw = inv.issueDate || inv.createdAt || inv.updatedAt;
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const resolveReceiptDate = (rec: Receipt) => {
      const raw = rec.time || rec.createdAt || rec.updatedAt;
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const isInRange = (date: Date | null, start: Date, end: Date) => {
      if (!date) return false;
      return date >= start && date <= end;
    };

    const paidInvoicesInRange = invoices.filter((inv) => {
      const date = resolveInvoiceDate(inv);
      return inv.status === 'paid' && isInRange(date, periodStart, periodEnd);
    });
    const paidInvoiceRevenue = paidInvoicesInRange.reduce((sum, inv) => sum + inv.amount, 0);

    const receiptRevenue = receipts
      .filter((rec) => rec.status === 'completed')
      .filter((rec) => isInRange(resolveReceiptDate(rec), periodStart, periodEnd))
      .reduce((sum, rec) => sum + rec.amount, 0);

    const previousPaidRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .filter((inv) => isInRange(resolveInvoiceDate(inv), previousStart, previousEnd))
      .reduce((sum, inv) => sum + inv.amount, 0);

    const previousReceiptRevenue = receipts
      .filter((rec) => rec.status === 'completed')
      .filter((rec) => isInRange(resolveReceiptDate(rec), previousStart, previousEnd))
      .reduce((sum, rec) => sum + rec.amount, 0);

    const hasReceiptData = receipts.length > 0;
    const totalRevenue = hasReceiptData ? receiptRevenue : paidInvoiceRevenue;
    const previousRevenue = hasReceiptData ? previousReceiptRevenue : previousPaidRevenue;

    const revenueChange =
      previousRevenue > 0
        ? `${(((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)}%`
        : totalRevenue > 0 ? '+100%' : '0%';

    const currentPeriodInvoices = invoices.filter((inv) =>
      isInRange(resolveInvoiceDate(inv), periodStart, periodEnd)
    ).length;
    const previousPeriodInvoices = invoices.filter((inv) =>
      isInRange(resolveInvoiceDate(inv), previousStart, previousEnd)
    ).length;

    const invoiceChange =
      previousPeriodInvoices > 0
        ? `${(((currentPeriodInvoices - previousPeriodInvoices) / previousPeriodInvoices) * 100).toFixed(1)}%`
        : currentPeriodInvoices > 0 ? '+100%' : '0%';

    const currentPeriodCustomers = customers.filter((cust) => {
      const date = new Date(cust.createdAt);
      return isInRange(Number.isNaN(date.getTime()) ? null : date, periodStart, periodEnd);
    }).length;
    const previousPeriodCustomers = customers.filter((cust) => {
      const date = new Date(cust.createdAt);
      return isInRange(Number.isNaN(date.getTime()) ? null : date, previousStart, previousEnd);
    }).length;

    const customerChange =
      previousPeriodCustomers > 0
        ? `${(((currentPeriodCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100).toFixed(1)}%`
        : currentPeriodCustomers > 0 ? '+100%' : '0%';

    const totalOutstanding = invoices
      .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);

    const averageInvoiceValue =
      invoices.length > 0
        ? invoices.reduce((sum, inv) => sum + inv.amount, 0) / invoices.length
        : 0;

    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const paymentCollectionRate = totalInvoiceAmount > 0 ? (totalPaidAmount / totalInvoiceAmount) * 100 : 100;

    const receiptsToday = receipts.filter((receipt) => {
      const date = resolveReceiptDate(receipt);
      if (!date) return false;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return receipt.status === 'completed' && date >= start && date <= end;
    });

    return {
      totalRevenue,
      outstandingPayments: totalOutstanding,
      lowStockItems: inventory.filter((item) => item.status === 'low-stock' || item.status === 'out-of-stock').length,
      totalInvoices: invoices.length,
      totalPaid: hasReceiptData ? receiptRevenue : paidInvoiceRevenue,
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.status === 'active').length,
      overdueInvoices: invoices.filter((inv) => inv.status === 'overdue').length,
      totalReceipts: receipts.length,
      todayReceipts: receiptsToday.length,
      receiptsRevenue: receiptRevenue,
      monthlyRevenue: totalRevenue,
      weeklyRevenue: totalRevenue,
      revenueChange: totalRevenue > previousRevenue ? `+${revenueChange}` : revenueChange,
      invoiceChange: currentPeriodInvoices > previousPeriodInvoices ? `+${invoiceChange}` : invoiceChange,
      customerChange: currentPeriodCustomers > previousPeriodCustomers ? `+${customerChange}` : customerChange,
      averageInvoiceValue,
      paymentCollectionRate,
    };
  }, [customers, inventory, invoices, receipts]);

  const dashboardStats = useMemo(() => getDashboardStats(), [getDashboardStats]);

  const selectedInvoiceTemplate = useMemo(
    () => templates.find((template) => template.id === invoiceTemplateId) || null,
    [templates, invoiceTemplateId]
  );

  const selectedReceiptTemplate = useMemo(
    () => templates.find((template) => template.id === receiptTemplateId) || null,
    [templates, receiptTemplateId]
  );

  const formatNotificationTime = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const generateNotificationsFromData = useCallback(() => {
    const newNotifications: Notification[] = [];
    const now = new Date();

    invoices
      .filter((inv) => inv.status === 'overdue')
      .forEach((invoice) => {
        const overdueDays = Math.floor((now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        newNotifications.push({
          id: `overdue_${invoice.id}_${invoice.updatedAt || invoice.createdAt}`,
          type: 'error',
          title: 'Invoice Overdue',
          message: `Invoice #${invoice.number} for ${invoice.customer} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`,
          time: formatNotificationTime(new Date(invoice.updatedAt || invoice.createdAt)),
          read: false,
          action: {
            label: 'View Invoice',
            route: `/(modals)/invoice-detail?id=${invoice.id}`,
          },
          createdAt: new Date(invoice.updatedAt || invoice.createdAt),
          priority: 'high',
          dataId: invoice.id,
        });
      });

    inventory
      .filter((item) => item.status === 'low-stock' || item.status === 'out-of-stock')
      .forEach((product) => {
        newNotifications.push({
          id: `stock_${product.id}_${product.updatedAt}`,
          type: product.status === 'out-of-stock' ? 'error' : 'warning',
          title: product.status === 'out-of-stock' ? 'Out of Stock' : 'Low Stock Alert',
          message:
            product.status === 'out-of-stock'
              ? `${product.name} is out of stock.`
              : `${product.name} is running low (${product.quantity} left).`,
          time: formatNotificationTime(new Date(product.updatedAt)),
          read: false,
          action: {
            label: 'Manage Stock',
            route: `/(modals)/product-detail?id=${product.id}`,
          },
          createdAt: new Date(product.updatedAt),
          priority: product.status === 'out-of-stock' ? 'high' : 'medium',
          dataId: product.id,
        });
      });

    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    invoices
      .filter((inv) => inv.status === 'paid' && new Date(inv.updatedAt || inv.createdAt) > threeDaysAgo)
      .forEach((invoice) => {
        newNotifications.push({
          id: `payment_${invoice.id}_${invoice.updatedAt || invoice.createdAt}`,
          type: 'payment',
          title: 'Payment Received',
        message: `${formatMoney(invoice.paidAmount || 0)} payment from ${invoice.customer}`,
          time: formatNotificationTime(new Date(invoice.updatedAt || invoice.createdAt)),
          read: true,
          action: {
            label: 'View Invoice',
            route: `/(modals)/invoice-detail?id=${invoice.id}`,
          },
          createdAt: new Date(invoice.updatedAt || invoice.createdAt),
          priority: 'medium',
          dataId: invoice.id,
        });
      });

    setNotifications((prev) => {
      const systemPrefixes = ['overdue_', 'stock_', 'payment_'];
      const isSystem = (id: string) => systemPrefixes.some((prefix) => id.startsWith(prefix));
      const existingMap = new Map(prev.map((notification) => [notification.id, notification]));

      const mergedSystem = newNotifications.map((notification) => {
        const existing = existingMap.get(notification.id);
        return existing ? { ...notification, read: existing.read } : notification;
      });

      const manualNotifications = prev.filter((notification) => !isSystem(notification.id));
      const combined = [...manualNotifications, ...mergedSystem];
      combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return combined;
    });
  }, [invoices, inventory, formatNotificationTime]);

  useEffect(() => {
    generateNotificationsFromData();
  }, [generateNotificationsFromData]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      const createdAt = new Date();
      const newNotification: Notification = {
        ...notification,
        time: notification.time || formatNotificationTime(createdAt),
        id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt,
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    [formatNotificationTime]
  );

  const refreshTemplates = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response: any = await apiGet('/api/v1/templates');
      const templatesData = response?.data ?? response ?? [];
      const mergedTemplates = await mergeTemplates(templatesData);
      const mappedTemplates = mergedTemplates.map(mapTemplate);
      setTemplates(mappedTemplates);
      await applyTemplateSelection(mappedTemplates);
    } catch (error) {
      console.error('Failed to refresh templates:', error);
      await loadFallbackTemplates();
    }
  }, [isAuthenticated, mapTemplate, applyTemplateSelection, mergeTemplates, loadFallbackTemplates]);

  const setInvoiceTemplate = useCallback(async (templateId: string) => {
    setInvoiceTemplateId(templateId);
    await AsyncStorage.setItem(INVOICE_TEMPLATE_KEY, templateId);
  }, []);

  const setReceiptTemplate = useCallback(async (templateId: string) => {
    setReceiptTemplateId(templateId);
    await AsyncStorage.setItem(RECEIPT_TEMPLATE_KEY, templateId);
  }, []);

  const purchaseTemplate = useCallback(
    async (templateId: string) => {
      try {
        const response: any = await initializeTemplatePayment({ templateId });
        const data = response?.data ?? response ?? {};
        const url = data?.authorizationUrl || data?.authorization_url;
        if (url) {
          await Linking.openURL(url);
          Alert.alert('Complete Payment', 'Finish Paystack checkout to unlock the template.');
        } else {
          Alert.alert('Payment Error', 'Unable to start payment. Please try again.');
        }
      } catch (error) {
        Alert.alert('Payment Error', 'Unable to start payment. Please try again.');
      }
      await refreshTemplates();
    },
    [refreshTemplates]
  );

  const createCategory = useCallback(
    async (name: string) => {
      const response: any = await apiPost('/api/v1/categories', { name });
      const category = mapCategory(response.data || response);
      setCategories((prev) => [category, ...prev]);
      addNotification({
        type: 'success',
        title: 'Category Added',
        message: `${category.name} was created successfully.`,
        time: 'Just now',
        action: {
          label: 'View Categories',
          route: '/(modals)/manage-categories',
        },
        priority: 'low',
        dataId: category.id,
      });
      return category.id;
    },
    [addNotification, mapCategory]
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      const response: any = await apiPut(`/api/v1/categories/${id}`, updates);
      const updated = mapCategory(response.data || response);
      setCategories((prev) => prev.map((cat) => (cat.id === id ? updated : cat)));
      addNotification({
        type: 'info',
        title: 'Category Updated',
        message: `${updated.name} details were updated.`,
        time: 'Just now',
        action: {
          label: 'View Categories',
          route: '/(modals)/manage-categories',
        },
        priority: 'low',
        dataId: updated.id,
      });
    },
    [addNotification, mapCategory]
  );

  const deleteCategory = useCallback(async (id: string) => {
    const existing = categories.find((cat) => cat.id === id);
    await apiDelete(`/api/v1/categories/${id}`);
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    addNotification({
      type: 'warning',
      title: 'Category Removed',
      message: existing ? `${existing.name} was removed.` : 'Category removed.',
      time: 'Just now',
      action: {
        label: 'View Categories',
        route: '/(modals)/manage-categories',
      },
      priority: 'medium',
      dataId: id,
    });
  }, [addNotification, categories]);

  const resolveCategoryId = useCallback(
    async (categoryName?: string, categoryId?: string) => {
      if (categoryId) return categoryId;
      if (!categoryName) return undefined;
      const existing = categories.find((cat) => cat.name.toLowerCase() === categoryName.toLowerCase());
      if (existing) return existing.id;
      return createCategory(categoryName);
    },
    [categories, createCategory]
  );

  const resolveSupplierId = useCallback(
    async (supplierName?: string, supplierId?: string) => {
      if (supplierId) return supplierId;
      if (!supplierName) return undefined;
      const existing = suppliers.find((sup) => sup.name.toLowerCase() === supplierName.toLowerCase());
      if (existing) return existing.id;
      const response: any = await apiPost('/api/v1/suppliers', { name: supplierName });
      const supplier = mapSupplier(response.data || response);
      setSuppliers((prev) => [supplier, ...prev]);
      return supplier.id;
    },
    [suppliers, mapSupplier]
  );

  const adjustStockForInvoiceItems = useCallback(async (items: InvoiceItem[], invoiceNumber?: string) => {
    const adjustments = items.filter((item) => item.productId && item.quantity > 0);
    if (adjustments.length === 0) return;

    await Promise.all(
      adjustments.map((item) =>
        apiPost(`/api/v1/products/${item.productId}/adjust-stock`, {
          quantity: -Math.abs(item.quantity),
          type: 'sale',
          reason: invoiceNumber ? `Invoice ${invoiceNumber}` : 'Invoice sale',
        })
      )
    );
  }, []);

  const createInvoice = useCallback(
    async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
      const customerId =
        invoiceData.customerId ||
        customers.find((c) => c.id === invoiceData.customer || c.name === invoiceData.customer)?.id;

      if (!customerId) {
        throw new Error('Customer not found');
      }

      const items = invoiceData.items.map((item) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        return {
          product: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: 0,
          discount: 0,
          discountType: 'fixed',
          taxAmount: 0,
          total: itemSubtotal,
        };
      });

      const payload: any = {
        invoiceNumber: invoiceData.number,
        customer: customerId,
        date: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        items,
        amountPaid: invoiceData.paidAmount ?? 0,
        status: mapInvoiceStatusToApi(invoiceData.status),
        notes: invoiceData.notes,
        templateStyle: invoiceData.templateStyle,
      };

      if (invoiceData.taxRateUsed !== undefined) payload.taxRateUsed = invoiceData.taxRateUsed;
      if (invoiceData.taxAmount !== undefined) payload.taxAmount = invoiceData.taxAmount;
      if (invoiceData.taxName) payload.taxName = invoiceData.taxName;
      if (invoiceData.isTaxOverridden !== undefined) payload.isTaxOverridden = invoiceData.isTaxOverridden;
      if (invoiceData.recurring) {
        payload.recurring = {
          ...invoiceData.recurring,
          isRecurring: Boolean(invoiceData.recurring.isRecurring),
        };
      }

      const response: any = await apiPost('/api/v1/invoices', payload);
      const mappedInvoice = mapInvoice(response.data || response);
      const resolvedInvoiceTemplateStyle =
        mappedInvoice.templateStyle ||
        invoiceData.templateStyle ||
        selectedInvoiceTemplate?.templateStyle ||
        selectedInvoiceTemplate?.id;
      const invoice = resolvedInvoiceTemplateStyle
        ? { ...mappedInvoice, templateStyle: resolvedInvoiceTemplateStyle }
        : mappedInvoice;
      setInvoices((prev) => [invoice, ...prev]);
      await saveInvoiceTemplateStyle(invoice.id, resolvedInvoiceTemplateStyle);
      if (invoiceData.status !== 'draft') {
        try {
          await adjustStockForInvoiceItems(invoiceData.items, invoice.number);
          addNotification({
            type: 'invoice',
            title: 'Inventory Updated',
            message: `Stock reduced for invoice #${invoice.number}.`,
            time: 'Just now',
            action: {
              label: 'View Inventory',
              route: '/(tabs)/inventory',
            },
            priority: 'medium',
            dataId: invoice.id,
          });
        } catch (error) {
          console.error('Failed to adjust stock for invoice:', error);
          addNotification({
            type: 'warning',
            title: 'Stock Update Failed',
            message: `Invoice #${invoice.number} was created, but stock update failed.`,
            time: 'Just now',
            action: {
              label: 'Review Stock',
              route: '/(tabs)/inventory',
            },
            priority: 'high',
            dataId: invoice.id,
          });
        }
      }
      addNotification({
        type: 'invoice',
        title: invoiceData.status === 'draft' ? 'Invoice Draft Saved' : 'Invoice Created',
        message: `Invoice #${invoice.number} for ${invoice.customer} was ${invoiceData.status === 'draft' ? 'saved as draft' : 'created'}.`,
        time: 'Just now',
        action: {
          label: 'View Invoice',
          route: `/(modals)/invoice-detail?id=${invoice.id}`,
        },
        priority: invoiceData.status === 'draft' ? 'low' : 'medium',
        dataId: invoice.id,
      });
      await refreshData();
      return invoice.id;
    },
    [
      customers,
      mapInvoice,
      refreshData,
      adjustStockForInvoiceItems,
      addNotification,
      saveInvoiceTemplateStyle,
      selectedInvoiceTemplate,
    ]
  );

  const updateInvoice = useCallback(
    async (id: string, updates: Partial<Invoice>) => {
      const existing = invoices.find((inv) => inv.id === id);
      const wasDraft = existing?.status === 'draft';
      const becomesActive = updates.status && updates.status !== 'draft';
      const shouldAdjustStock = Boolean(wasDraft && becomesActive);

      const payload: any = {};

      if (updates.status) {
        payload.status = mapInvoiceStatusToApi(updates.status);
      }
      if (updates.paidAmount !== undefined) {
        payload.amountPaid = updates.paidAmount;
      }
      if (updates.issueDate) {
        payload.date = updates.issueDate;
      }
      if (updates.dueDate) {
        payload.dueDate = updates.dueDate;
      }
      if (updates.notes !== undefined) {
        payload.notes = updates.notes;
      }
      if (updates.taxRateUsed !== undefined) {
        payload.taxRateUsed = updates.taxRateUsed;
      }
      if (updates.taxAmount !== undefined) {
        payload.taxAmount = updates.taxAmount;
      }
      if (updates.taxName !== undefined) {
        payload.taxName = updates.taxName;
      }
      if (updates.isTaxOverridden !== undefined) {
        payload.isTaxOverridden = updates.isTaxOverridden;
      }
      if (updates.recurring !== undefined) {
        payload.recurring = updates.recurring;
      }

      if (updates.items) {
        payload.items = updates.items.map((item) => ({
          product: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: 0,
          discount: 0,
          discountType: 'fixed',
          taxAmount: 0,
          total: item.quantity * item.unitPrice,
        }));
      }

      const response: any = await apiPut(`/api/v1/invoices/${id}`, payload);
      const updated = mapInvoice(response.data || response);
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
      if (shouldAdjustStock) {
        const itemsToAdjust = updates.items || existing?.items || [];
        try {
          await adjustStockForInvoiceItems(itemsToAdjust, updated.number);
          addNotification({
            type: 'invoice',
            title: 'Inventory Updated',
            message: `Stock reduced for invoice #${updated.number}.`,
            time: 'Just now',
            action: {
              label: 'View Inventory',
              route: '/(tabs)/inventory',
            },
            priority: 'medium',
            dataId: updated.id,
          });
        } catch (error) {
          console.error('Failed to adjust stock for invoice update:', error);
          addNotification({
            type: 'warning',
            title: 'Stock Update Failed',
            message: `Invoice #${updated.number} was updated, but stock update failed.`,
            time: 'Just now',
            action: {
              label: 'Review Stock',
              route: '/(tabs)/inventory',
            },
            priority: 'high',
            dataId: updated.id,
          });
        }
      }

      if (updates.status) {
        addNotification({
          type: 'invoice',
          title: 'Invoice Updated',
          message: `Invoice #${updated.number} marked as ${updates.status}.`,
          time: 'Just now',
          action: {
            label: 'View Invoice',
            route: `/(modals)/invoice-detail?id=${updated.id}`,
          },
          priority: updates.status === 'paid' ? 'high' : 'medium',
          dataId: updated.id,
        });
      } else {
        addNotification({
          type: 'info',
          title: 'Invoice Updated',
          message: `Invoice #${updated.number} details were updated.`,
          time: 'Just now',
          action: {
            label: 'View Invoice',
            route: `/(modals)/invoice-detail?id=${updated.id}`,
          },
          priority: 'low',
          dataId: updated.id,
        });
      }
    },
    [mapInvoice, invoices, adjustStockForInvoiceItems, addNotification]
  );

  const deleteInvoice = useCallback(
    async (id: string) => {
      const existing = invoices.find((inv) => inv.id === id);
      await apiDelete(`/api/v1/invoices/${id}`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      addNotification({
        type: 'warning',
        title: 'Invoice Deleted',
        message: existing ? `Invoice #${existing.number} was deleted.` : 'Invoice was deleted.',
        time: 'Just now',
        action: {
          label: 'View Invoices',
          route: '/(tabs)/invoices',
        },
        priority: 'medium',
        dataId: id,
      });
    },
    [addNotification, invoices]
  );

  const recordPayment = useCallback(
    async (invoiceId: string, amount: number, paymentMethod?: string) => {
      const response: any = await apiPost(`/api/v1/invoices/${invoiceId}/payment`, {
        amount,
        paymentMethod: paymentMethod || 'cash',
      });

      const invoice = response?.data?.invoice ? mapInvoice(response.data.invoice) : response?.invoice ? mapInvoice(response.invoice) : null;
      const receipt = response?.data?.receipt ? mapReceipt(response.data.receipt) : null;

      if (invoice) {
        setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? invoice : inv)));
      }
      if (receipt) {
        setReceipts((prev) => [receipt, ...prev]);
      }
      if (invoice) {
        addNotification({
          type: 'payment',
          title: 'Payment Recorded',
          message: `${formatMoney(amount || 0)} received for invoice #${invoice.number}.`,
          time: 'Just now',
          action: {
            label: 'View Invoice',
            route: `/(modals)/invoice-detail?id=${invoice.id}`,
          },
          priority: 'high',
          dataId: invoice.id,
        });
      }
      await refreshData();
    },
    [mapInvoice, mapReceipt, refreshData, addNotification]
  );

  const getInvoiceById = (id: string) => invoices.find((invoice) => invoice.id === id);
  const getInvoices = () => invoices;

  const createProduct = useCallback(
    async (productData: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
      const categoryId = await resolveCategoryId(productData.category, productData.categoryId);
      const supplierId = await resolveSupplierId(productData.supplier, productData.supplierId);

      const payload: any = {
        name: productData.name,
        sku: productData.sku,
        description: productData.description,
        category: categoryId,
        sellingPrice: productData.price,
        costPrice: productData.costPrice,
        barcode: productData.barcode,
        tags: productData.tags,
        stock: {
          quantity: productData.quantity,
          lowStockThreshold: productData.lowStockThreshold,
        },
      };

      if (supplierId) {
        payload.supplier = supplierId;
      }

      if (productData.image) {
        const resolvedImage = await resolveImageDataUri(productData.image);
        if (resolvedImage) {
          payload.images = [{ url: resolvedImage, isPrimary: true }];
        }
      }

      const response: any = await apiPost('/api/v1/products', payload);
      const product = mapProduct(response.data || response);
      setInventory((prev) => [product, ...prev]);
      addNotification({
        type: 'success',
        title: 'Product Added',
        message: `${product.name} was added to inventory.`,
        time: 'Just now',
        action: {
          label: 'View Product',
          route: `/(modals)/product-detail?id=${product.id}`,
        },
        priority: 'medium',
        dataId: product.id,
      });
      await refreshData();
      return product.id;
    },
    [mapProduct, refreshData, resolveCategoryId, resolveSupplierId, addNotification]
  );

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>) => {
      const payload: any = {};

      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.sku !== undefined) payload.sku = updates.sku;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.price !== undefined) payload.sellingPrice = updates.price;
      if (updates.costPrice !== undefined) payload.costPrice = updates.costPrice;
      if (updates.barcode !== undefined) payload.barcode = updates.barcode;
      if (updates.tags !== undefined) payload.tags = updates.tags;

      if (updates.categoryId || updates.category) {
        payload.category = await resolveCategoryId(updates.category, updates.categoryId);
      }
      if (updates.supplierId || updates.supplier) {
        payload.supplier = await resolveSupplierId(updates.supplier, updates.supplierId);
      }

      if (updates.quantity !== undefined || updates.lowStockThreshold !== undefined) {
        payload.stock = {};
        if (updates.quantity !== undefined) payload.stock.quantity = updates.quantity;
        if (updates.lowStockThreshold !== undefined) payload.stock.lowStockThreshold = updates.lowStockThreshold;
      }

      if (updates.image) {
        const resolvedImage = await resolveImageDataUri(updates.image);
        if (resolvedImage) {
          payload.images = [{ url: resolvedImage, isPrimary: true }];
        }
      }

      const response: any = await apiPut(`/api/v1/products/${id}`, payload);
      const updated = mapProduct(response.data || response);
      setInventory((prev) => prev.map((item) => (item.id === id ? updated : item)));
      addNotification({
        type: 'info',
        title: 'Product Updated',
        message: `${updated.name} details were updated.`,
        time: 'Just now',
        action: {
          label: 'View Product',
          route: `/(modals)/product-detail?id=${updated.id}`,
        },
        priority: 'low',
        dataId: updated.id,
      });
      await refreshData();
    },
    [mapProduct, refreshData, resolveCategoryId, resolveSupplierId, addNotification]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const existing = inventory.find((product) => product.id === id);
      await apiPut(`/api/v1/products/${id}`, { isActive: false });
      setInventory((prev) => prev.filter((product) => product.id !== id));
      addNotification({
        type: 'warning',
        title: 'Product Removed',
        message: existing ? `${existing.name} was removed from inventory.` : 'Product removed from inventory.',
        time: 'Just now',
        action: {
          label: 'View Inventory',
          route: '/(tabs)/inventory',
        },
        priority: 'medium',
        dataId: id,
      });
    },
    [addNotification, inventory]
  );

  const adjustStock = useCallback(
    async (id: string, quantity: number, type: 'add' | 'remove' | 'set') => {
      const product = inventory.find((item) => item.id === id);
      if (!product) {
        throw new Error('Product not found');
      }

      let delta = quantity;
      if (type === 'remove') delta = -Math.abs(quantity);
      if (type === 'set') delta = quantity - product.quantity;

      await apiPost(`/api/v1/products/${id}/adjust-stock`, {
        quantity: delta,
        type: type === 'add' ? 'Adjustment (Increase)' : type === 'remove' ? 'Adjustment (Decrease)' : 'adjustment',
      });

      addNotification({
        type: 'info',
        title: 'Stock Adjusted',
        message:
          type === 'set'
            ? `Stock for ${product.name} set to ${quantity}.`
            : `${Math.abs(quantity)} units ${type === 'add' ? 'added to' : 'removed from'} ${product.name}.`,
        time: 'Just now',
        action: {
          label: 'View Product',
          route: `/(modals)/product-detail?id=${product.id}`,
        },
        priority: 'medium',
        dataId: product.id,
      });

      await refreshData();
    },
    [inventory, refreshData, addNotification]
  );

  const getProductById = (id: string) => inventory.find((product) => product.id === id);
  const getProducts = () => inventory;

  const createCustomer = useCallback(
    async (
      customerData: Omit<Customer, 'id' | 'outstanding' | 'totalSpent' | 'lastTransaction' | 'invoices' | 'createdAt' | 'updatedAt'>
    ) => {
      const payload = {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        company: customerData.company,
        notes: customerData.notes,
        address: customerData.address ? { street: customerData.address } : undefined,
      };

      const response: any = await apiPost('/api/v1/customers', payload);
      const customer = mapCustomer(response.data || response);
      setCustomers((prev) => [customer, ...prev]);
      addNotification({
        type: 'success',
        title: 'Customer Added',
        message: `${customer.name} was added successfully.`,
        time: 'Just now',
        action: {
          label: 'View Customer',
          route: `/(modals)/customer-detail?id=${customer.id}`,
        },
        priority: 'low',
        dataId: customer.id,
      });
      return customer.id;
    },
    [mapCustomer, addNotification]
  );

  const updateCustomer = useCallback(
    async (id: string, updates: Partial<Customer>) => {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.company !== undefined) payload.company = updates.company;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.address !== undefined) payload.address = { street: updates.address };

      const response: any = await apiPut(`/api/v1/customers/${id}`, payload);
      const customer = mapCustomer(response.data || response);
      setCustomers((prev) => prev.map((item) => (item.id === id ? customer : item)));
      addNotification({
        type: 'info',
        title: 'Customer Updated',
        message: `${customer.name} details were updated.`,
        time: 'Just now',
        action: {
          label: 'View Customer',
          route: `/(modals)/customer-detail?id=${customer.id}`,
        },
        priority: 'low',
        dataId: customer.id,
      });
    },
    [mapCustomer, addNotification]
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      const existing = customers.find((customer) => customer.id === id);
      await apiDelete(`/api/v1/customers/${id}`);
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
      addNotification({
        type: 'warning',
        title: 'Customer Removed',
        message: existing ? `${existing.name} was removed.` : 'Customer removed.',
        time: 'Just now',
        action: {
          label: 'View Customers',
          route: '/(more)/customer',
        },
        priority: 'medium',
        dataId: id,
      });
    },
    [addNotification, customers]
  );

  const getCustomerById = (id: string) => customers.find((customer) => customer.id === id);
  const getCustomers = () => customers;

  const createReceipt = useCallback(
    async (receiptData: Omit<Receipt, 'id' | 'number' | 'createdAt'>) => {
      const payload = {
        customer: receiptData.customerId,
        customerName: receiptData.customer,
        customerEmail: receiptData.customerEmail,
        customerPhone: receiptData.customerPhone,
        items: receiptData.items.map((item) => ({
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        paymentMethod: receiptData.paymentMethod,
        amountPaid: receiptData.amount,
        templateStyle:
          selectedReceiptTemplate?.templateStyle ||
          selectedReceiptTemplate?.id ||
          receiptData.templateStyle ||
          'standard',
        notes: receiptData.notes,
      };

      const response: any = await apiPost('/api/v1/receipts', payload);
      const mappedReceipt = mapReceipt(response.data || response);
      const resolvedReceiptTemplateStyle =
        mappedReceipt.templateStyle ||
        receiptData.templateStyle ||
        selectedReceiptTemplate?.templateStyle ||
        selectedReceiptTemplate?.id;
      const receipt = resolvedReceiptTemplateStyle
        ? { ...mappedReceipt, templateStyle: resolvedReceiptTemplateStyle }
        : mappedReceipt;
      setReceipts((prev) => [receipt, ...prev]);
      await saveReceiptTemplateStyle(receipt.id, resolvedReceiptTemplateStyle);
      addNotification({
        type: 'success',
        title: 'Receipt Created',
        message: `Receipt #${receipt.number} created for ${receipt.customer}.`,
        time: 'Just now',
        action: {
          label: 'View Receipt',
          route: `/(modals)/receipt-detail?id=${receipt.id}`,
        },
        priority: 'medium',
        dataId: receipt.id,
      });
      await refreshData();
      return receipt.id;
    },
    [
      mapReceipt,
      refreshData,
      addNotification,
      selectedReceiptTemplate,
      saveReceiptTemplateStyle,
    ]
  );

  const addReceipt = createReceipt;

  const updateReceipt = useCallback(
    async (id: string, updates: Partial<Receipt>) => {
      if (updates.status === 'refunded') {
        const response: any = await apiPost(`/api/v1/receipts/${id}/void`, { reason: 'Refunded via app' });
        const receipt = mapReceipt(response.data || response);
        setReceipts((prev) => prev.map((item) => (item.id === id ? receipt : item)));
        addNotification({
          type: 'warning',
          title: 'Receipt Refunded',
          message: `Receipt #${receipt.number} was refunded.`,
          time: 'Just now',
          action: {
            label: 'View Receipt',
            route: `/(modals)/receipt-detail?id=${receipt.id}`,
          },
          priority: 'high',
          dataId: receipt.id,
        });
        return;
      }

      Alert.alert('Not Supported', 'Receipt updates are limited to refunds.');
    },
    [mapReceipt, addNotification]
  );

  const deleteReceipt = useCallback(
    async (id: string) => {
      const response: any = await apiPost(`/api/v1/receipts/${id}/void`, { reason: 'Deleted via app' });
      const receipt = mapReceipt(response.data || response);
      setReceipts((prev) => prev.map((item) => (item.id === id ? receipt : item)));
      addNotification({
        type: 'warning',
        title: 'Receipt Voided',
        message: `Receipt #${receipt.number} was voided.`,
        time: 'Just now',
        action: {
          label: 'View Receipt',
          route: `/(modals)/receipt-detail?id=${receipt.id}`,
        },
        priority: 'medium',
        dataId: receipt.id,
      });
    },
    [mapReceipt, addNotification]
  );

  const getReceiptById = (id: string) => receipts.find((receipt) => receipt.id === id);
  const getReceipts = () => receipts;

  const searchData = (query: string, type: 'all' | 'invoices' | 'customers' | 'products' | 'receipts') => {
    const searchTerm = query.toLowerCase();

    if (type === 'invoices' || type === 'all') {
      const invoiceResults = invoices.filter(
        (invoice) =>
          invoice.number.toLowerCase().includes(searchTerm) ||
          invoice.customer.toLowerCase().includes(searchTerm) ||
          invoice.status.toLowerCase().includes(searchTerm)
      );
      if (type === 'invoices') return invoiceResults;
    }

    if (type === 'customers' || type === 'all') {
      const customerResults = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm) ||
          customer.phone.toLowerCase().includes(searchTerm) ||
          customer.company.toLowerCase().includes(searchTerm)
      );
      if (type === 'customers') return customerResults;
    }

    if (type === 'products' || type === 'all') {
      const productResults = inventory.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      );
      if (type === 'products') return productResults;
    }

    if (type === 'receipts' || type === 'all') {
      const receiptResults = receipts.filter(
        (receipt) =>
          receipt.number.toLowerCase().includes(searchTerm) ||
          receipt.customer.toLowerCase().includes(searchTerm) ||
          receipt.paymentMethod.toLowerCase().includes(searchTerm)
      );
      if (type === 'receipts') return receiptResults;
    }

    return [];
  };

  const value: DataContextType = {
    invoices,
    inventory,
    customers,
    receipts,
    categories,
    dashboardStats,
    loading,
    notifications,
    templates,
    selectedInvoiceTemplate,
    selectedReceiptTemplate,
    taxSettings,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    addNotification,
    createCategory,
    updateCategory,
    deleteCategory,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    recordPayment,
    getInvoiceById,
    getInvoices,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getProductById,
    getProducts,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomers,
    createReceipt,
    addReceipt,
    updateReceipt,
    deleteReceipt,
    getReceiptById,
    getReceipts,
    refreshData,
    searchData,
    generateNotificationsFromData,
    refreshTemplates,
    setInvoiceTemplate,
    setReceiptTemplate,
    purchaseTemplate,
    refreshTaxSettings,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

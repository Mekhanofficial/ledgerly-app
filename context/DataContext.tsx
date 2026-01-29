// contexts/DataContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';

// Types
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
  description: string;
  supplier: string;
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

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes: string;
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
  customerEmail: string;
  customerPhone: string;
  time: string;
  amount: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mobile';
  status: 'completed' | 'refunded' | 'pending';
  items: ReceiptItem[];
  notes: string;
  createdAt: string;
  updatedAt?: string;
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
  dataId?: string; // Reference to the actual data object
}

// Initial data
const initialInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-001',
    customer: 'TechFlow Solutions',
    customerEmail: 'contact@techflow.com',
    customerPhone: '(555) 123-4567',
    issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 2850,
    paidAmount: 2850,
    status: 'paid',
    items: [
      { id: '1', description: 'Website Redesign', quantity: 1, unitPrice: 2000 },
      { id: '2', description: 'SEO Optimization', quantity: 1, unitPrice: 850 },
    ],
    notes: 'Payment received via bank transfer',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    number: 'INV-2024-002',
    customer: 'Global Marketing Inc',
    customerEmail: 'billing@globalmarketing.com',
    customerPhone: '(555) 234-5678',
    issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 1200,
    paidAmount: 0,
    status: 'pending',
    items: [
      { id: '1', description: 'Social Media Campaign', quantity: 1, unitPrice: 1200 },
    ],
    notes: 'Follow up in 3 days',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    number: 'INV-2024-003',
    customer: 'Retail Partners LLC',
    customerEmail: 'accounts@retailpartners.com',
    customerPhone: '(555) 345-6789',
    issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 950,
    paidAmount: 0,
    status: 'overdue',
    items: [
      { id: '1', description: 'E-commerce Setup', quantity: 1, unitPrice: 950 },
    ],
    notes: 'Urgent: 15 days overdue',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    number: 'INV-2024-004',
    customer: 'ABC Corporation',
    customerEmail: 'contact@abccorp.com',
    customerPhone: '(555) 123-4567',
    issueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 3500,
    paidAmount: 3500,
    status: 'paid',
    items: [
      { id: '1', description: 'Consulting Services', quantity: 10, unitPrice: 350 },
    ],
    notes: 'Payment received via credit card',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialInventory: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones Pro',
    sku: 'WH-PRO-001',
    price: 129.99,
    costPrice: 85.00,
    quantity: 45,
    lowStockThreshold: 10,
    category: 'Electronics',
    status: 'in-stock',
    description: 'Premium wireless bluetooth headphones with noise cancellation',
    supplier: 'AudioTech Inc',
    barcode: '8901234567890',
    tags: ['audio', 'premium', 'wireless'],
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Office Desk Lamp',
    sku: 'DL-ERG-002',
    price: 89.99,
    costPrice: 45.00,
    quantity: 3,
    lowStockThreshold: 5,
    category: 'Furniture',
    status: 'low-stock',
    description: 'Ergonomic LED desk lamp with adjustable brightness',
    supplier: 'OfficePro Supplies',
    barcode: '8901234567891',
    tags: ['office', 'lighting', 'ergonomic'],
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=500&q=80',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Mechanical Keyboard',
    sku: 'KB-MECH-003',
    price: 159.99,
    costPrice: 95.00,
    quantity: 0,
    lowStockThreshold: 5,
    category: 'Electronics',
    status: 'out-of-stock',
    description: 'RGB mechanical keyboard with brown switches',
    supplier: 'KeyTech Ltd',
    barcode: '8901234567892',
    tags: ['gaming', 'keyboard', 'rgb'],
    image: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=500&q=80',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Office Supplies',
    sku: 'OS-BASIC-001',
    price: 25.99,
    costPrice: 15.00,
    quantity: 100,
    lowStockThreshold: 20,
    category: 'Supplies',
    status: 'in-stock',
    description: 'General office supplies',
    supplier: 'Office Depot',
    barcode: '8901234567893',
    tags: ['office', 'supplies'],
    image: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=500&q=80',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'ABC Corporation',
    email: 'contact@abccorp.com',
    phone: '(555) 123-4567',
    company: 'ABC Corporation',
    address: '123 Business Ave, Suite 456\nCommerce City, CA 90210',
    outstanding: 4250,
    totalSpent: 24850,
    lastTransaction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    invoices: ['1', '4'],
    notes: 'VIP customer - 10% discount on all purchases',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Tech Solutions Ltd',
    email: 'info@techsolutions.com',
    phone: '(555) 234-5678',
    company: 'Tech Solutions Ltd',
    address: '456 Tech Park, Silicon Valley, CA 94000',
    outstanding: 1850,
    totalSpent: 12460,
    lastTransaction: new Date().toISOString(),
    status: 'active',
    invoices: ['2'],
    notes: 'Monthly subscription client',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Global Marketing Inc',
    email: 'billing@globalmarketing.com',
    phone: '(555) 234-5678',
    company: 'Global Marketing Inc',
    address: '789 Marketing St, Suite 101',
    outstanding: 1200,
    totalSpent: 8500,
    lastTransaction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    invoices: [],
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '(555) 987-6543',
    company: 'Individual',
    address: '789 Oak Street, Anytown, CA 90210',
    outstanding: 0,
    totalSpent: 127.50,
    lastTransaction: new Date().toISOString(),
    status: 'active',
    invoices: [],
    notes: 'Walk-in customer',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialReceipts: Receipt[] = [
  {
    id: '1',
    number: 'RCP-001',
    customer: 'Sarah Johnson',
    customerEmail: 'sarah@email.com',
    customerPhone: '(555) 987-6543',
    time: new Date().toISOString(),
    amount: 127.50,
    subtotal: 117.97,
    tax: 10.03,
    discount: 0.50,
    paymentMethod: 'cash',
    status: 'completed',
    items: [
      { id: '1', name: 'Office Supplies', quantity: 1, price: 25.99 },
      { id: '2', name: 'Wireless Mouse', quantity: 1, price: 39.99 },
      { id: '3', name: 'Premium Notebook', quantity: 1, price: 15.50 },
      { id: '4', name: 'Highlighter Set', quantity: 2, price: 6.99 },
    ],
    notes: 'Customer requested email receipt',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    number: 'RCP-002',
    customer: 'Walk-in Customer',
    customerEmail: '',
    customerPhone: '',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 89.99,
    subtotal: 89.99,
    tax: 0,
    discount: 0,
    paymentMethod: 'card',
    status: 'completed',
    items: [
      { id: '1', name: 'Office Desk Lamp', quantity: 1, price: 89.99 },
    ],
    notes: '',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Context type
export interface DataContextType {
  // Data
  invoices: Invoice[];
  inventory: Product[];
  customers: Customer[];
  receipts: Receipt[];
  dashboardStats: DashboardStats;
  loading: boolean;
  notifications: Notification[];
  
  // Notification methods
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  
  // Invoice methods
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'number'>) => Promise<string>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  recordPayment: (invoiceId: string, amount: number) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoices: () => Invoice[];
  
  // Product/Inventory methods
  createProduct: (productData: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (id: string, quantity: number, type: 'add' | 'remove' | 'set') => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProducts: () => Product[];
  
  // Customer methods
  createCustomer: (customerData: Omit<Customer, 'id' | 'outstanding' | 'totalSpent' | 'lastTransaction' | 'invoices' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomers: () => Customer[];
  
  // Receipt methods
  createReceipt: (receiptData: Omit<Receipt, 'id' | 'number' | 'createdAt'>) => Promise<string>;
  addReceipt: (receiptData: Omit<Receipt, 'id' | 'number' | 'createdAt'>) => Promise<string>;
  updateReceipt: (id: string, updates: Partial<Receipt>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  getReceiptById: (id: string) => Receipt | undefined;
  getReceipts: () => Receipt[];
  
  // Utility methods
  refreshData: () => Promise<void>;
  searchData: (query: string, type: 'all' | 'invoices' | 'customers' | 'products' | 'receipts') => any[];
  generateNotificationsFromData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [inventory, setInventory] = useState<Product[]>(initialInventory);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate comprehensive dashboard stats
  const getDashboardStats = (): DashboardStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    // Today's receipts
    const todayReceipts = receipts.filter(receipt => {
      const receiptDate = new Date(receipt.createdAt);
      receiptDate.setHours(0, 0, 0, 0);
      return receiptDate.getTime() === today.getTime() && receipt.status === 'completed';
    });
    
    // Weekly receipts
    const weeklyReceipts = receipts.filter(receipt => {
      const receiptDate = new Date(receipt.createdAt);
      return receiptDate >= oneWeekAgo && receipt.status === 'completed';
    });
    
    // Monthly receipts
    const monthlyReceipts = receipts.filter(receipt => {
      const receiptDate = new Date(receipt.createdAt);
      return receiptDate >= oneMonthAgo && receipt.status === 'completed';
    });
    
    // Previous month receipts (for comparison)
    const prevMonthReceipts = receipts.filter(receipt => {
      const receiptDate = new Date(receipt.createdAt);
      return receiptDate >= twoMonthsAgo && receiptDate < oneMonthAgo && receipt.status === 'completed';
    });
    
    // Revenue calculations
    const receiptsRevenue = todayReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    const monthlyRevenue = monthlyReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    const weeklyRevenue = weeklyReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    const prevMonthlyRevenue = prevMonthReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    
    // Invoice calculations
    const totalPaidInvoices = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const totalOutstanding = invoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
    
    const totalRevenue = totalPaidInvoices + receiptsRevenue;
    
    // Calculate changes
    const revenueChange = prevMonthlyRevenue > 0 
      ? `${(((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100).toFixed(1)}%`
      : '+100%';
    
    // Invoice count changes
    const currentMonthInvoices = invoices.filter(inv => {
      const invoiceDate = new Date(inv.createdAt);
      return invoiceDate >= oneMonthAgo;
    }).length;
    
    const prevMonthInvoices = invoices.filter(inv => {
      const invoiceDate = new Date(inv.createdAt);
      return invoiceDate >= twoMonthsAgo && invoiceDate < oneMonthAgo;
    }).length;
    
    const invoiceChange = prevMonthInvoices > 0
      ? `${(((currentMonthInvoices - prevMonthInvoices) / prevMonthInvoices) * 100).toFixed(1)}%`
      : '+100%';
    
    // Customer changes
    const currentMonthCustomers = customers.filter(cust => {
      const customerDate = new Date(cust.createdAt);
      return customerDate >= oneMonthAgo;
    }).length;
    
    const prevMonthCustomers = customers.filter(cust => {
      const customerDate = new Date(cust.createdAt);
      return customerDate >= twoMonthsAgo && customerDate < oneMonthAgo;
    }).length;
    
    const customerChange = prevMonthCustomers > 0
      ? `${(((currentMonthCustomers - prevMonthCustomers) / prevMonthCustomers) * 100).toFixed(1)}%`
      : '+100%';
    
    // Average invoice value
    const averageInvoiceValue = invoices.length > 0 
      ? invoices.reduce((sum, inv) => sum + inv.amount, 0) / invoices.length
      : 0;
    
    // Payment collection rate
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const paymentCollectionRate = totalInvoiceAmount > 0
      ? (totalPaidAmount / totalInvoiceAmount) * 100
      : 100;
    
    return {
      totalRevenue,
      outstandingPayments: totalOutstanding,
      lowStockItems: inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').length,
      totalInvoices: invoices.length,
      totalPaid: totalPaidInvoices,
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
      totalReceipts: receipts.length,
      todayReceipts: todayReceipts.length,
      receiptsRevenue,
      monthlyRevenue,
      weeklyRevenue,
      revenueChange: monthlyRevenue > prevMonthlyRevenue ? `+${revenueChange}` : revenueChange,
      invoiceChange: currentMonthInvoices > prevMonthInvoices ? `+${invoiceChange}` : invoiceChange,
      customerChange: currentMonthCustomers > prevMonthCustomers ? `+${customerChange}` : customerChange,
      averageInvoiceValue,
      paymentCollectionRate,
    };
  };

  const dashboardStats = getDashboardStats();

  // Format time for notifications
  const formatNotificationTime = (date: Date): string => {
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
  };

  // Generate real notifications from actual data
  const generateNotificationsFromData = () => {
    const newNotifications: Notification[] = [];
    const now = new Date();

    // 1. OVERDUE INVOICES
    invoices
      .filter(inv => inv.status === 'overdue')
      .forEach(invoice => {
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
            route: `/(modals)/invoice-detail?id=${invoice.id}`
          },
          createdAt: new Date(invoice.updatedAt || invoice.createdAt),
          priority: 'high',
          dataId: invoice.id
        });
      });

    // 2. RECENT PAYMENTS (Last 3 days)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    invoices
      .filter(inv => inv.status === 'paid' && new Date(inv.updatedAt || inv.createdAt) > threeDaysAgo)
      .forEach(invoice => {
        newNotifications.push({
          id: `payment_${invoice.id}_${invoice.updatedAt || invoice.createdAt}`,
          type: 'payment',
          title: 'Payment Received',
          message: `$${invoice.paidAmount.toFixed(2)} payment from ${invoice.customer} for Invoice #${invoice.number}`,
          time: formatNotificationTime(new Date(invoice.updatedAt || invoice.createdAt)),
          read: true,
          action: {
            label: 'View Invoice',
            route: `/(modals)/invoice-detail?id=${invoice.id}`
          },
          createdAt: new Date(invoice.updatedAt || invoice.createdAt),
          priority: 'medium',
          dataId: invoice.id
        });
      });

    // 3. LOW STOCK ALERTS
    inventory
      .filter(item => item.status === 'low-stock')
      .forEach(product => {
        newNotifications.push({
          id: `lowstock_${product.id}_${product.updatedAt}`,
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.quantity} left, threshold: ${product.lowStockThreshold})`,
          time: formatNotificationTime(new Date(product.updatedAt)),
          read: false,
          action: {
            label: 'Manage Stock',
            route: `/(modals)/product-detail?id=${product.id}`
          },
          createdAt: new Date(product.updatedAt),
          priority: 'medium',
          dataId: product.id
        });
      });

    // 4. OUT OF STOCK ALERTS
    inventory
      .filter(item => item.status === 'out-of-stock')
      .forEach(product => {
        newNotifications.push({
          id: `outofstock_${product.id}_${product.updatedAt}`,
          type: 'error',
          title: 'Out of Stock',
          message: `${product.name} is out of stock. Consider restocking.`,
          time: formatNotificationTime(new Date(product.updatedAt)),
          read: false,
          action: {
            label: 'Restock Now',
            route: `/(modals)/product-detail?id=${product.id}`
          },
          createdAt: new Date(product.updatedAt),
          priority: 'high',
          dataId: product.id
        });
      });

    // 5. NEW CUSTOMERS (Last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    customers
      .filter(cust => new Date(cust.createdAt) > sevenDaysAgo)
      .forEach(customer => {
        newNotifications.push({
          id: `newcustomer_${customer.id}_${customer.createdAt}`,
          type: 'info',
          title: 'New Customer Added',
          message: `${customer.name} has been added to your customer list`,
          time: formatNotificationTime(new Date(customer.createdAt)),
          read: true,
          action: {
            label: 'View Customer',
            route: `/(modals)/customer-detail?id=${customer.id}`
          },
          createdAt: new Date(customer.createdAt),
          priority: 'low',
          dataId: customer.id
        });
      });

    // 6. NEW INVOICES (Last 7 days)
    invoices
      .filter(inv => new Date(inv.createdAt) > sevenDaysAgo && inv.status !== 'draft')
      .forEach(invoice => {
        newNotifications.push({
          id: `newinvoice_${invoice.id}_${invoice.createdAt}`,
          type: 'invoice',
          title: 'New Invoice Created',
          message: `Invoice #${invoice.number} for $${invoice.amount.toFixed(2)} created for ${invoice.customer}`,
          time: formatNotificationTime(new Date(invoice.createdAt)),
          read: true,
          action: {
            label: 'View Invoice',
            route: `/(modals)/invoice-detail?id=${invoice.id}`
          },
          createdAt: new Date(invoice.createdAt),
          priority: 'low',
          dataId: invoice.id
        });
      });

    // 7. UPCOMING DUE DATES (Next 7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    invoices
      .filter(inv => {
        const dueDate = new Date(inv.dueDate);
        return dueDate > now && 
               dueDate <= sevenDaysFromNow && 
               inv.status !== 'paid' && 
               inv.status !== 'cancelled';
      })
      .forEach(invoice => {
        const dueInDays = Math.ceil((new Date(invoice.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        newNotifications.push({
          id: `upcoming_${invoice.id}_${invoice.dueDate}`,
          type: 'warning',
          title: 'Invoice Due Soon',
          message: `Invoice #${invoice.number} is due in ${dueInDays} day${dueInDays > 1 ? 's' : ''}`,
          time: 'Upcoming',
          read: false,
          action: {
            label: 'View Invoice',
            route: `/(modals)/invoice-detail?id=${invoice.id}`
          },
          createdAt: new Date(),
          priority: 'medium',
          dataId: invoice.id
        });
      });

    // 8. NEW RECEIPTS (Last 3 days)
    receipts
      .filter(receipt => new Date(receipt.createdAt) > threeDaysAgo)
      .forEach(receipt => {
        newNotifications.push({
          id: `receipt_${receipt.id}_${receipt.createdAt}`,
          type: 'success',
          title: 'New Sale',
          message: `Receipt #${receipt.number} for $${receipt.amount.toFixed(2)} from ${receipt.customer}`,
          time: formatNotificationTime(new Date(receipt.createdAt)),
          read: true,
          action: {
            label: 'View Receipt',
            route: `/(modals)/receipt-detail?id=${receipt.id}`
          },
          createdAt: new Date(receipt.createdAt),
          priority: 'low',
          dataId: receipt.id
        });
      });

    // 9. HIGH VALUE PAYMENTS (> $5000)
    invoices
      .filter(inv => inv.status === 'paid' && inv.amount >= 5000)
      .forEach(invoice => {
        newNotifications.push({
          id: `highvalue_${invoice.id}_${invoice.updatedAt || invoice.createdAt}`,
          type: 'success',
          title: 'High Value Payment',
          message: `Large payment of $${invoice.amount.toFixed(2)} received from ${invoice.customer}`,
          time: formatNotificationTime(new Date(invoice.updatedAt || invoice.createdAt)),
          read: true,
          action: {
            label: 'View Invoice',
            route: `/(modals)/invoice-detail?id=${invoice.id}`
          },
          createdAt: new Date(invoice.updatedAt || invoice.createdAt),
          priority: 'medium',
          dataId: invoice.id
        });
      });

    // Sort by priority and date (high priority first, then newest)
    newNotifications.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = (priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']);
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return newNotifications;
  };

  // Update notifications when data changes
  useEffect(() => {
    const generatedNotifications = generateNotificationsFromData();
    
    // Merge with existing notifications to preserve read status
    setNotifications(prev => {
      const merged = generatedNotifications.map(newNotif => {
        const existing = prev.find(p => p.id === newNotif.id);
        if (existing) {
          // Preserve read status but update other fields if needed
          return { ...newNotif, read: existing.read };
        }
        return newNotif;
      });
      
      // Remove old notifications (older than 60 days)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const filtered = merged.filter(n => n.createdAt > sixtyDaysAgo);
      
      return filtered;
    });
  }, [invoices, inventory, customers, receipts]);

  // Add manual notification
  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date(),
      priority: notificationData.type === 'error' ? 'high' : 
                notificationData.type === 'warning' ? 'medium' : 'low'
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-mark as read after 5 seconds if it's not an error
    if (notificationData.type !== 'error') {
      setTimeout(() => {
        markNotificationAsRead(newNotification.id);
      }, 5000);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => setNotifications([])
        }
      ]
    );
  };

  // Invoice Methods
  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'number'>): Promise<string> => {
    setLoading(true);
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(3, '0')}`;
      const newInvoice: Invoice = {
        ...invoiceData,
        id: `inv_${Date.now()}`,
        number: invoiceNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        inventoryAdjusted: false,
      };
      
      setInvoices(prev => [newInvoice, ...prev]);
      
      // Add notification for new invoice
      addNotification({
        type: 'invoice',
        title: 'New Invoice Created',
        message: `Invoice #${newInvoice.number} for $${newInvoice.amount.toFixed(2)} created`,
        time: 'Just now',
        action: {
          label: 'View Invoice',
          route: `/(modals)/invoice-detail?id=${newInvoice.id}`
        }
      });
      
      // Update customer's outstanding balance
      if (invoiceData.customer) {
        const customer = customers.find(c => c.name === invoiceData.customer);
        if (customer) {
          await updateCustomer(customer.id, {
            outstanding: customer.outstanding + invoiceData.amount,
            totalSpent: customer.totalSpent + invoiceData.amount,
            lastTransaction: new Date().toISOString(),
            invoices: [...(customer.invoices || []), newInvoice.id],
          });
        }
      }
      
      return newInvoice.id;
    } catch (error) {
      Alert.alert('Error', 'Failed to create invoice');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  type StockShortage = {
    name: string;
    requested: number;
    available: number;
  };

  const reduceInventoryForInvoice = async (invoice: Invoice): Promise<StockShortage[]> => {
    const shortages: StockShortage[] = [];
    const availability = new Map<string, number>();
    inventory.forEach(product => availability.set(product.id, product.quantity));

    for (const item of invoice.items) {
      const product =
        (item.productId && inventory.find(p => p.id === item.productId)) ??
        inventory.find(p => p.name === item.description);

      if (!product) {
        shortages.push({
          name: item.description || 'Unknown item',
          requested: item.quantity,
          available: 0,
        });
        continue;
      }

      const available = availability.get(product.id) ?? product.quantity;
      const removeAmount = Math.min(available, item.quantity);

      if (removeAmount > 0) {
        availability.set(product.id, available - removeAmount);
        await adjustStock(product.id, removeAmount, 'remove');
      }

      if (removeAmount < item.quantity) {
        shortages.push({
          name: product.name,
          requested: item.quantity,
          available,
        });
      }
    }

    return shortages;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<void> => {
    setLoading(true);
    try {
      const oldInvoice = invoices.find(inv => inv.id === id);
      const mergedInvoice = oldInvoice
        ? { ...oldInvoice, ...updates, updatedAt: new Date().toISOString() }
        : undefined;
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === id ? { ...invoice, ...updates, updatedAt: new Date().toISOString() } : invoice
        )
      );
      
      const shouldReduceStock =
        oldInvoice &&
        updates.status === 'sent' &&
        oldInvoice.status !== 'sent' &&
        !(oldInvoice.inventoryAdjusted ?? false) &&
        mergedInvoice;

      if (shouldReduceStock) {
        const shortages = await reduceInventoryForInvoice(mergedInvoice as Invoice);
        setInvoices(prev => 
          prev.map(invoice => 
            invoice.id === id ? { ...invoice, inventoryAdjusted: true } : invoice
          )
        );

        if (shortages.length > 0) {
          const message = shortages
            .map(s => `${s.name}: requested ${s.requested}, available ${s.available}`)
            .join('\n');
          Alert.alert('Stock Warning', `Unable to fully reduce stock for:\n${message}`);
        }
      }
      
      // Add notification for status change
      if (oldInvoice && updates.status && oldInvoice.status !== updates.status) {
        if (updates.status === 'paid') {
          addNotification({
            type: 'payment',
            title: 'Invoice Paid',
            message: `Invoice #${oldInvoice.number} marked as paid`,
            time: 'Just now',
            action: {
              label: 'View Invoice',
              route: `/(modals)/invoice-detail?id=${id}`
            }
          });
        } else if (updates.status === 'overdue') {
          addNotification({
            type: 'error',
            title: 'Invoice Overdue',
            message: `Invoice #${oldInvoice.number} is now overdue`,
            time: 'Just now',
            action: {
              label: 'View Invoice',
              route: `/(modals)/invoice-detail?id=${id}`
            }
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update invoice');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const invoice = invoices.find(inv => inv.id === id);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      
      // Update customer's outstanding balance
      if (invoice) {
        const customer = customers.find(c => c.invoices?.includes(id));
        if (customer) {
          await updateCustomer(customer.id, {
            outstanding: Math.max(0, customer.outstanding - (invoice.amount - invoice.paidAmount)),
            invoices: customer.invoices?.filter(invId => invId !== id),
          });
        }
        
        // Add notification
        addNotification({
          type: 'warning',
          title: 'Invoice Deleted',
          message: `Invoice #${invoice.number} has been deleted`,
          time: 'Just now'
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete invoice');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (invoiceId: string, amount: number): Promise<void> => {
    setLoading(true);
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      const newPaidAmount = invoice.paidAmount + amount;
      const status = newPaidAmount >= invoice.amount ? 'paid' : invoice.status;
      
      await updateInvoice(invoiceId, {
        paidAmount: newPaidAmount,
        status,
      });
      
      // Update customer's outstanding balance
      const customer = customers.find(c => c.name === invoice.customer);
      if (customer) {
        await updateCustomer(customer.id, {
          outstanding: Math.max(0, customer.outstanding - amount),
          lastTransaction: new Date().toISOString(),
        });
      }
      
      // Add payment notification
      addNotification({
        type: 'payment',
        title: 'Payment Recorded',
        message: `$${amount.toFixed(2)} payment recorded for Invoice #${invoice.number}`,
        time: 'Just now',
        action: {
          label: 'View Invoice',
          route: `/(modals)/invoice-detail?id=${invoiceId}`
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceById = (id: string): Invoice | undefined => {
    return invoices.find(inv => inv.id === id);
  };

  const getInvoices = (): Invoice[] => {
    return invoices;
  };

  // Product/Inventory Methods
  const createProduct = async (productData: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    setLoading(true);
    try {
      const status = productData.quantity <= 0 
        ? 'out-of-stock' 
        : productData.quantity <= productData.lowStockThreshold 
          ? 'low-stock' 
          : 'in-stock';
      
      const newProduct: Product = {
        ...productData,
        id: `prod_${Date.now()}`,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setInventory(prev => [newProduct, ...prev]);
      
      // Add notification
      addNotification({
        type: 'info',
        title: 'New Product Added',
        message: `${newProduct.name} added to inventory`,
        time: 'Just now',
        action: {
          label: 'View Product',
          route: `/(modals)/product-detail?id=${newProduct.id}`
        }
      });
      
      return newProduct.id;
    } catch (error) {
      Alert.alert('Error', 'Failed to create product');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
    setLoading(true);
    try {
      const product = inventory.find(item => item.id === id);
      if (!product) throw new Error('Product not found');
      
      const newQuantity = updates.quantity ?? product.quantity;
      const lowStockThreshold = updates.lowStockThreshold ?? product.lowStockThreshold;
      
      const status = newQuantity <= 0 
        ? 'out-of-stock' 
        : newQuantity <= lowStockThreshold 
          ? 'low-stock' 
          : 'in-stock';
      
      setInventory(prev => 
        prev.map(item => 
          item.id === id 
            ? { 
                ...item, 
                ...updates, 
                status,
                updatedAt: new Date().toISOString() 
              } 
            : item
        )
      );
      
      // Add notification for stock changes
      if (updates.quantity !== undefined && updates.quantity !== product.quantity) {
        const difference = updates.quantity - product.quantity;
        if (difference > 0) {
          addNotification({
            type: 'success',
            title: 'Stock Updated',
            message: `Added ${difference} units of ${product.name}`,
            time: 'Just now',
            action: {
              label: 'View Product',
              route: `/(modals)/product-detail?id=${id}`
            }
          });
        } else if (status === 'out-of-stock') {
          addNotification({
            type: 'error',
            title: 'Out of Stock',
            message: `${product.name} is now out of stock`,
            time: 'Just now',
            action: {
              label: 'Restock',
              route: `/(modals)/product-detail?id=${id}`
            }
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update product');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const product = inventory.find(item => item.id === id);
      setInventory(prev => prev.filter(item => item.id !== id));
      
      if (product) {
        addNotification({
          type: 'warning',
          title: 'Product Deleted',
          message: `${product.name} removed from inventory`,
          time: 'Just now'
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete product');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (id: string, quantity: number, type: 'add' | 'remove' | 'set'): Promise<void> => {
    setLoading(true);
    try {
      const product = inventory.find(item => item.id === id);
      if (!product) throw new Error('Product not found');
      
      let newQuantity = product.quantity;
      switch (type) {
        case 'add':
          newQuantity += quantity;
          break;
        case 'remove':
          newQuantity = Math.max(0, newQuantity - quantity);
          break;
        case 'set':
          newQuantity = quantity;
          break;
      }
      
      await updateProduct(id, { quantity: newQuantity });
    } catch (error) {
      Alert.alert('Error', 'Failed to adjust stock');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (id: string): Product | undefined => {
    return inventory.find(item => item.id === id);
  };

  const getProducts = (): Product[] => {
    return inventory;
  };

  // Customer Methods
  const createCustomer = async (
    customerData: Omit<Customer, 'id' | 'outstanding' | 'totalSpent' | 'lastTransaction' | 'invoices' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    setLoading(true);
    try {
      const newCustomer: Customer = {
        ...customerData,
        id: `cust_${Date.now()}`,
        outstanding: 0,
        totalSpent: 0,
        lastTransaction: 'Never',
        invoices: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setCustomers(prev => [newCustomer, ...prev]);
      
      // Add notification
      addNotification({
        type: 'info',
        title: 'New Customer Added',
        message: `${newCustomer.name} added to customers`,
        time: 'Just now',
        action: {
          label: 'View Customer',
          route: `/(modals)/customer-detail?id=${newCustomer.id}`
        }
      });
      
      return newCustomer.id;
    } catch (error) {
      Alert.alert('Error', 'Failed to create customer');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<void> => {
    setLoading(true);
    try {
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id 
            ? { 
                ...customer, 
                ...updates, 
                updatedAt: new Date().toISOString() 
              } 
            : customer
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update customer');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const customer = customers.find(c => c.id === id);
      
      // Delete all invoices associated with this customer first
      if (customer?.invoices) {
        for (const invoiceId of customer.invoices) {
          await deleteInvoice(invoiceId);
        }
      }
      
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      
      if (customer) {
        addNotification({
          type: 'warning',
          title: 'Customer Deleted',
          message: `${customer.name} removed from customers`,
          time: 'Just now'
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete customer');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomers = (): Customer[] => {
    return customers;
  };

  // Receipt Methods
  const createReceipt = async (receiptData: Omit<Receipt, 'id' | 'number' | 'createdAt'>): Promise<string> => {
    setLoading(true);
    try {
      const receiptNumber = `RCP-${(receipts.length + 1).toString().padStart(3, '0')}`;
      
      const newReceipt: Receipt = {
        ...receiptData,
        id: `rcpt_${Date.now()}`,
        number: receiptNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setReceipts(prev => [newReceipt, ...prev]);
      
      // Add notification
      addNotification({
        type: 'success',
        title: 'New Sale',
        message: `Receipt #${newReceipt.number} for $${newReceipt.amount.toFixed(2)} created`,
        time: 'Just now',
        action: {
          label: 'View Receipt',
          route: `/(modals)/receipt-detail?id=${newReceipt.id}`
        }
      });
      
      // Update customer's total spent if customer exists
      if (receiptData.customer && receiptData.customer !== 'Walk-in Customer') {
        const customer = customers.find(c => c.name === receiptData.customer);
        if (customer) {
          await updateCustomer(customer.id, {
            totalSpent: customer.totalSpent + receiptData.amount,
            lastTransaction: new Date().toISOString(),
          });
        }
      }
      
      // Update inventory quantities
      for (const item of receiptData.items) {
        const product = inventory.find(p => p.name === item.name);
        if (product) {
          await adjustStock(product.id, item.quantity, 'remove');
        }
      }
      
      return newReceipt.id;
    } catch (error) {
      Alert.alert('Error', 'Failed to create receipt');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Alias for createReceipt
  const addReceipt = createReceipt;

  const updateReceipt = async (id: string, updates: Partial<Receipt>): Promise<void> => {
    setLoading(true);
    try {
      setReceipts(prev => 
        prev.map(receipt => 
          receipt.id === id ? { ...receipt, ...updates, updatedAt: new Date().toISOString() } : receipt
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update receipt');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteReceipt = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const receipt = receipts.find(rcpt => rcpt.id === id);
      setReceipts(prev => prev.filter(receipt => receipt.id !== id));
      
      // Restore inventory quantities
      if (receipt) {
        for (const item of receipt.items) {
          const product = inventory.find(p => p.name === item.name);
          if (product) {
            await adjustStock(product.id, item.quantity, 'add');
          }
        }
        
        // Update customer's total spent if needed
        if (receipt.customer && receipt.customer !== 'Walk-in Customer') {
          const customer = customers.find(c => c.name === receipt.customer);
          if (customer) {
            await updateCustomer(customer.id, {
              totalSpent: Math.max(0, customer.totalSpent - receipt.amount),
            });
          }
        }
        
        // Add notification
        addNotification({
          type: 'warning',
          title: 'Receipt Deleted',
          message: `Receipt #${receipt.number} has been deleted`,
          time: 'Just now'
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete receipt');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getReceiptById = (id: string): Receipt | undefined => {
    return receipts.find(receipt => receipt.id === id);
  };

  const getReceipts = (): Receipt[] => {
    return receipts;
  };

  // Search functionality
  const searchData = (query: string, type: 'all' | 'invoices' | 'customers' | 'products' | 'receipts'): any[] => {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return [];
    
    switch (type) {
      case 'invoices':
        return invoices.filter(invoice => 
          invoice.number.toLowerCase().includes(searchTerm) ||
          invoice.customer.toLowerCase().includes(searchTerm) ||
          invoice.status.toLowerCase().includes(searchTerm)
        );
      
      case 'customers':
        return customers.filter(customer => 
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm) ||
          customer.company.toLowerCase().includes(searchTerm)
        );
      
      case 'products':
        return inventory.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      
      case 'receipts':
        return receipts.filter(receipt => 
          receipt.number.toLowerCase().includes(searchTerm) ||
          receipt.customer.toLowerCase().includes(searchTerm) ||
          receipt.paymentMethod.toLowerCase().includes(searchTerm)
        );
      
      case 'all':
      default:
        return [
          ...invoices.filter(inv => 
            inv.number.toLowerCase().includes(searchTerm) ||
            inv.customer.toLowerCase().includes(searchTerm)
          ),
          ...customers.filter(cust => 
            cust.name.toLowerCase().includes(searchTerm) ||
            cust.email.toLowerCase().includes(searchTerm)
          ),
          ...inventory.filter(prod => 
            prod.name.toLowerCase().includes(searchTerm) ||
            prod.sku.toLowerCase().includes(searchTerm)
          ),
          ...receipts.filter(rcpt => 
            rcpt.number.toLowerCase().includes(searchTerm) ||
            rcpt.customer.toLowerCase().includes(searchTerm)
          )
        ];
    }
  };

  // Utility Methods
  const refreshData = async (): Promise<void> => {
    setLoading(true);
    try {
      // In a real app, this would fetch from an API
      // For now, we'll just simulate a refresh and regenerate notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add refresh notification
      addNotification({
        type: 'info',
        title: 'Data Refreshed',
        message: 'All data has been refreshed successfully',
        time: 'Just now'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Simulate real-time updates for invoice statuses
  useEffect(() => {
    const interval = setInterval(() => {
      // Update invoice statuses based on due dates
      setInvoices(prev => 
        prev.map(invoice => {
          if (invoice.status === 'paid' || invoice.status === 'cancelled') {
            return invoice;
          }
          
          const dueDate = new Date(invoice.dueDate);
          const now = new Date();
          const isOverdue = dueDate < now;
          
          if (isOverdue && invoice.status !== 'overdue') {
            return { ...invoice, status: 'overdue' };
          }
          return invoice;
        })
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const value: DataContextType = {
    // Data
    invoices,
    inventory,
    customers,
    receipts,
    dashboardStats,
    notifications,
    loading,
    
    // Notification methods
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    addNotification,
    generateNotificationsFromData,
    
    // Invoice methods
    createInvoice,
    updateInvoice,
    deleteInvoice,
    recordPayment,
    getInvoiceById,
    getInvoices,
    
    // Product methods
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getProductById,
    getProducts,
    
    // Customer methods
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomers,
    
    // Receipt methods
    createReceipt,
    addReceipt,
    updateReceipt,
    deleteReceipt,
    getReceiptById,
    getReceipts,
    
    // Search
    searchData,
    
    // Utility methods
    refreshData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

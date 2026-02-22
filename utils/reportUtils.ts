import { Invoice, Receipt } from '@/context/DataContext';
import { formatCurrency } from '@/utils/currency';

export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year';

export const TIME_RANGE_OPTIONS: { id: TimeRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year', label: 'This Year' },
];

export interface InvoiceSummary {
  paid: number;
  pending: number;
  overdue: number;
  total: number;
}

export interface ReceiptSummary {
  completed: number;
  refunded: number;
  total: number;
}

export const getInvoiceSummary = (invoices: Invoice[]): InvoiceSummary => {
  const summary: InvoiceSummary = {
    paid: 0,
    pending: 0,
    overdue: 0,
    total: 0,
  };

  invoices.forEach((invoice) => {
    summary.total += invoice.amount;
    if (invoice.status === 'paid') {
      summary.paid += invoice.amount;
    } else if (invoice.status === 'pending') {
      summary.pending += invoice.amount;
    } else if (invoice.status === 'overdue') {
      summary.overdue += invoice.amount;
    }
  });

  return summary;
};

export const getReceiptSummary = (receipts: Receipt[]): ReceiptSummary => {
  const summary: ReceiptSummary = {
    completed: 0,
    refunded: 0,
    total: 0,
  };

  receipts.forEach((receipt) => {
    summary.total += receipt.amount;
    if (receipt.status === 'completed') {
      summary.completed += receipt.amount;
    } else if (receipt.status === 'refunded') {
      summary.refunded += receipt.amount;
    }
  });

  return summary;
};

export const formatTimeRangeLabel = (range: TimeRange, now = new Date()): string => {
  const labels: Record<TimeRange, string> = {
    today: now.toLocaleDateString('en-US', { weekday: 'long' }),
    week: `Week ${Math.ceil((now.getDate() - 1) / 7)}`,
    month: now.toLocaleDateString('en-US', { month: 'long' }),
    quarter: `Q${Math.floor(now.getMonth() / 3) + 1}`,
    year: now.getFullYear().toString(),
  };

  return labels[range];
};

export interface ReportHtmlParams {
  companyName: string;
  companyContact: string;
  selectedRangeId: TimeRange;
  invoiceSummary: InvoiceSummary;
  receiptSummary: ReceiptSummary;
  totalRevenue: number;
  currencyCode?: string;
  reportTitle?: string;
  reportSubtitle?: string;
  reportTypeLabel?: string;
}

export const createReportHTML = ({
  companyName,
  companyContact,
  selectedRangeId,
  invoiceSummary,
  receiptSummary,
  totalRevenue,
  currencyCode = 'USD',
  reportTitle,
  reportSubtitle,
  reportTypeLabel,
}: ReportHtmlParams): string => {
  const timeStamp = new Date().toLocaleString('en-US');
  const title = reportTitle || 'Ledgerly Report';
  const subtitle =
    reportSubtitle ||
    `${selectedRangeId.toUpperCase()}${reportTypeLabel ? ` - ${reportTypeLabel}` : ''} - Generated ${timeStamp}`;
  const formatMoney = (value: number) =>
    formatCurrency(value, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Helvetica', Arial, sans-serif; padding: 20px; color: #1f2937; }
        h1 { color: #4f46e5; margin-bottom: 4px; }
        .section { margin-top: 24px; }
        .label { font-weight: 600; color: #6b7280; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-top: 20px; }
        .card { border-radius: 12px; border: 1px solid #e5e7eb; padding: 14px; background: #fff; }
        .value { font-size: 20px; font-weight: 700; margin-top: 6px; }
        .footer { margin-top: 40px; color: #6b7280; font-size: 12px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="label">${subtitle}</div>
        <div class="label">${companyName}</div>
        <div class="label">${companyContact}</div>
      </div>
      <div class="section">
        <div class="label">Total Revenue</div>
        <div class="value">${formatMoney(totalRevenue)}</div>
      </div>
      <div class="section">
        <div class="label">Invoice Overview</div>
        <div class="grid">
          <div class="card">
            <div class="label">Paid</div>
            <div class="value">${formatMoney(invoiceSummary.paid)}</div>
          </div>
          <div class="card">
            <div class="label">Pending</div>
            <div class="value">${formatMoney(invoiceSummary.pending)}</div>
          </div>
          <div class="card">
            <div class="label">Overdue</div>
            <div class="value">${formatMoney(invoiceSummary.overdue)}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="label">Receipt Overview</div>
        <div class="grid">
          <div class="card">
            <div class="label">Completed</div>
            <div class="value">${formatMoney(receiptSummary.completed)}</div>
          </div>
          <div class="card">
            <div class="label">Refunded</div>
            <div class="value">${formatMoney(receiptSummary.refunded)}</div>
          </div>
        </div>
      </div>
      <div class="footer">Ledgerly - ${new Date().toLocaleDateString('en-US')}</div>
    </body>
    </html>
  `;
};

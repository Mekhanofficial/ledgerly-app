import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useData } from '@/context/DataContext';
import { useUser } from '@/context/UserContext';
import { hasRole, ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { getTemplateById } from '@/utils/templateCatalog';
import { buildTemplateVariables, resolveTemplateTheme } from '@/utils/templateStyles';
import { buildTemplateDecorations } from '@/utils/templateDecorations';
import { resolveTemplateStyleVariant } from '@/utils/templateStyleVariants';
import { formatCurrency, getCurrencySymbol, resolveCurrencyCode } from '@/utils/currency';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export default function InvoiceDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const {
    getInvoiceById,
    recordPayment,
    deleteInvoice,
    updateInvoice,
    selectedInvoiceTemplate,
    templates,
  } = useData();
  const { user } = useUser();
  const currencyCode = resolveCurrencyCode(user || undefined);
  const currencySymbol = getCurrencySymbol(currencyCode);
  const formatMoney = (value: number, options = {}) => formatCurrency(value, currencyCode, options);
  const { role, canAccess } = useRoleGuard(ROLE_GROUPS.app);
  const canManageInvoice = hasRole(role, ROLE_GROUPS.business);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [invoice, setInvoice] = useState(getInvoiceById(id as string));
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const templateForInvoice = useMemo(() => {
    if (!invoice) return selectedInvoiceTemplate || getTemplateById('standard');
    const style = invoice.templateStyle;
    if (!style) return selectedInvoiceTemplate || getTemplateById('standard');
    return (
      templates.find((template) => template.templateStyle === style || template.id === style) ||
      getTemplateById(style) ||
      selectedInvoiceTemplate ||
      getTemplateById('standard')
    );
  }, [invoice, templates, selectedInvoiceTemplate]);

  useEffect(() => {
    if (id) {
      const invoiceData = getInvoiceById(id as string);
      setInvoice(invoiceData);
    }
  }, [id, getInvoiceById]);

  const companyName = (
    user?.businessName?.trim() ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'Ledgerly Inc.'
  );
  const companyDetails = [
    user?.phoneNumber,
    user?.email,
    user?.country,
  ].filter(Boolean);
  const companyContactMarkup = companyDetails.length
    ? companyDetails.join('<br>')
    : 'support@ledgerly.com';

  if (!canAccess) {
    return null;
  }

  if (!invoice) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>Invoice not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary500 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const daysOverdue = Math.floor(
    (new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const subtotal = Number.isFinite(Number(invoice.subtotal))
    ? Number(invoice.subtotal)
    : invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxRate = Number.isFinite(Number(invoice.taxRateUsed)) ? Number(invoice.taxRateUsed) : 0;
  const taxName = invoice.taxName || 'Tax';
  const taxAmount = Number.isFinite(Number(invoice.taxAmount))
    ? Number(invoice.taxAmount)
    : (taxRate ? subtotal * (taxRate / 100) : 0);
  const showTax = taxAmount > 0 || taxRate > 0;
  const balanceDue = invoice.amount - invoice.paidAmount;

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    try {
      await recordPayment(invoice.id, parseFloat(paymentAmount));
      Alert.alert('Success', 'Payment recorded successfully');
      setPaymentAmount('');
      
      const updatedInvoice = getInvoiceById(id as string);
      setInvoice(updatedInvoice);
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const handleDeleteInvoice = async () => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteInvoice(invoice.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = async () => {
    try {
      await updateInvoice(invoice.id, {
        paidAmount: invoice.amount,
        status: 'paid',
      });
      
      const updatedInvoice = getInvoiceById(id as string);
      setInvoice(updatedInvoice);
      
      Alert.alert('Success', 'Invoice marked as paid');
    } catch (error) {
      Alert.alert('Error', 'Failed to update invoice');
    }
  };

  // Generate HTML for PDF
  const generateInvoiceHTML = () => {
    const issueDate = new Date(invoice.issueDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const resolvedTemplate = templateForInvoice || getTemplateById('standard');
    const templateTheme = resolveTemplateTheme(resolvedTemplate);
    const templateVariables = buildTemplateVariables(templateTheme);
    const templateVariant = resolveTemplateStyleVariant(
      invoice.templateStyle || resolvedTemplate?.id,
      resolvedTemplate
    );
    const { headerHtml, footerHtml, paddingTop, paddingBottom, pageStyle } =
      buildTemplateDecorations(templateVariant, {
        primary: templateTheme.primary,
        secondary: templateTheme.secondary,
        accent: templateTheme.accent,
        text: templateTheme.text,
      });
    const pageStyleAttr = pageStyle ? pageStyle : 'background: #ffffff;';
    const backgroundPattern = templateTheme.hasBackgroundPattern
      ? 'background-image: radial-gradient(var(--accent) 1px, transparent 1px); background-size: 14px 14px;'
      : '';
    const watermarkMarkup = templateTheme.showWatermark
      ? `<div class="watermark">${templateTheme.watermarkText}</div>`
      : '';
    const templateLabel = (resolvedTemplate?.name || resolvedTemplate?.id || 'Template').toUpperCase();
    const paymentTerms = resolvedTemplate?.paymentTerms || 'net-30';
    const currency = resolvedTemplate?.currency || currencyCode || 'USD';

    const customerMarkup = invoice.customer
      ? `
        <div style="background: ${templateTheme.accent}; padding: 25px; margin: 20px 0 30px 0; border-radius: 8px; border-left: 4px solid ${templateTheme.primary};">
          <div style="font-weight: bold; margin-bottom: 15px; color: ${templateTheme.primary}; font-size: 16px;">Bill To:</div>
          <div style="color: #495057;">
            <div style="font-weight: bold; font-size: 18px; margin-bottom: 8px;">${invoice.customer}</div>
            ${invoice.customerEmail ? `<div style="margin-bottom: 5px;">${invoice.customerEmail}</div>` : ''}
            ${invoice.customerPhone ? `<div>${invoice.customerPhone}</div>` : ''}
          </div>
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.number}</title>
        <style>
          ${templateVariables}
          * { box-sizing: border-box; }
          body {
            font-family: ${templateTheme.bodyFont};
            margin: 0;
            padding: 0;
            color: var(--text);
            background: var(--accent);
            ${backgroundPattern}
          }
          .page {
            position: relative;
            min-height: 100%;
            padding: 24px;
          }
          .watermark {
            position: fixed;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-20deg);
            font-size: 64px;
            color: rgba(0, 0, 0, 0.06);
            font-weight: bold;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div style="max-width: 800px; margin: 0 auto; position: relative; overflow: hidden; border-radius: 12px; background: white; ${pageStyleAttr}">
            ${headerHtml}
            ${footerHtml}
            <div style="position: relative; z-index: 2; padding: ${paddingTop}px 40px ${paddingBottom}px 40px;">
              ${watermarkMarkup}
              <div style="border-bottom: 3px solid ${templateTheme.primary}; padding-bottom: 30px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                  <div>
                    <h1 style="font-size: 32px; font-weight: bold; color: ${templateTheme.primary}; margin: 0 0 10px 0; font-family: ${templateTheme.titleFont};">INVOICE</h1>
                    <div style="background: ${templateTheme.primary}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block;">
                      ${templateLabel} TEMPLATE
                    </div>
                    <div style="color: #6c757d; font-size: 14px; margin-top: 15px;">
                      <div><strong>Invoice #:</strong> ${invoice.number}</div>
                      <div><strong>Issue Date:</strong> ${issueDate}</div>
                      <div><strong>Due Date:</strong> ${dueDate}</div>
                      <div><strong>Payment Terms:</strong> ${paymentTerms}</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 18px; font-weight: bold; color: ${templateTheme.primary}; margin-bottom: 10px;">
                      ${companyName}
                    </div>
                    <div style="color: #6c757d; font-size: 13px; line-height: 1.4;">
                      ${companyContactMarkup}
                    </div>
                  </div>
                </div>
              </div>

              ${customerMarkup}

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0 30px 0;">
                <thead>
                  <tr style="background: ${templateTheme.primary}; color: white;">
                    <th style="padding: 15px; text-align: left; font-weight: bold; font-size: 14px;">Description</th>
                    <th style="padding: 15px; text-align: left; font-weight: bold; font-size: 14px;">Qty</th>
                    <th style="padding: 15px; text-align: left; font-weight: bold; font-size: 14px;">Rate</th>
                    <th style="padding: 15px; text-align: left; font-weight: bold; font-size: 14px;">Tax</th>
                    <th style="padding: 15px; text-align: left; font-weight: bold; font-size: 14px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items
                    .map((item, index) => {
                      const lineSubtotal = item.unitPrice * item.quantity;
                      const lineTotal = lineSubtotal;
                      const taxLabel = showTax ? `${taxRate}%` : '-';
                      return `
                        <tr style="${index % 2 === 0 ? `background: ${templateTheme.accent};` : ''} border-bottom: 1px solid #e9ecef;">
                          <td style="padding: 15px; font-size: 14px; color: #495057;">${item.description}</td>
                          <td style="padding: 15px; font-size: 14px; color: #495057;">${item.quantity}</td>
                          <td style="padding: 15px; font-size: 14px; color: #495057;">${formatMoney(item.unitPrice)}</td>
                          <td style="padding: 15px; font-size: 14px; color: #495057;">${taxLabel}</td>
                          <td style="padding: 15px; font-size: 14px; font-weight: bold; color: #495057;">${formatMoney(lineTotal)}</td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid ${templateTheme.primary}; text-align: right;">
                <div style="margin-bottom: 10px;">
                  <span style="color: #6c757d; font-size: 14px;">Subtotal:</span>
                  <span style="font-weight: bold; color: #495057; margin-left: 20px; font-size: 16px;">${formatMoney(subtotal)}</span>
                </div>
                ${showTax ? `
                  <div style="margin-bottom: 20px;">
                    <span style="color: #6c757d; font-size: 14px;">${taxName} (${taxRate}%):</span>
                    <span style="font-weight: bold; color: #495057; margin-left: 20px; font-size: 16px;">${formatMoney(taxAmount)}</span>
                  </div>
                ` : ''}
                <div>
                  <span style="color: ${templateTheme.primary}; font-weight: bold; font-size: 20px;">Total:</span>
                  <span style="color: ${templateTheme.primary}; font-weight: bold; margin-left: 20px; font-size: 24px;">${formatMoney(invoice.amount)}</span>
                </div>
              </div>

              ${invoice.notes ? `
                <div style="margin-top: 30px; padding: 20px; background: ${templateTheme.accent}; border-radius: 8px;">
                  <div style="color: ${templateTheme.primary}; font-weight: bold; margin-bottom: 15px; font-size: 14px;">Notes</div>
                  <div style="color: #495057; line-height: 1.6; font-size: 14px; white-space: pre-line;">${invoice.notes}</div>
                </div>
              ` : ''}

              ${resolvedTemplate?.terms ? `
                <div style="margin-top: 20px; padding: 20px; background: ${templateTheme.accent}; border-radius: 8px;">
                  <div style="color: ${templateTheme.primary}; font-weight: bold; margin-bottom: 15px; font-size: 14px;">Terms & Conditions</div>
                  <div style="color: #495057; line-height: 1.6; font-size: 13px; white-space: pre-line;">${resolvedTemplate.terms}</div>
                </div>
              ` : ''}

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
                <div>Thank you for your business!</div>
                <div style="margin-top: 5px;">Generated by Ledgerly Invoice System - ${templateLabel} Template</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Generate HTML content
      const htmlContent = generateInvoiceHTML();
      
      // On mobile, we need to handle PDF generation differently
      if (Platform.OS === 'web') {
        // Web version
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        
        // For web, create a download link
        const link = document.createElement('a');
        link.href = uri;
        link.download = `Invoice_${invoice.number}_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Alert.alert('Success', 'PDF downloaded successfully');
      } else {
        // Mobile version
        try {
          // First try with printToFileAsync
          const { uri } = await Print.printToFileAsync({
            html: htmlContent,
            base64: false,
          });
          
          // Create a filename
          const fileName = `Invoice_${invoice.number}_${new Date().getTime()}.pdf`;
          
          // Check if we can share the file
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: `Invoice ${invoice.number}`,
              UTI: 'com.adobe.pdf',
            });
          } else {
            Alert.alert(
              'Success',
              `PDF saved to: ${uri}`,
              [{ text: 'OK' }]
            );
          }
        } catch (printError) {
          console.error('Print error:', printError);
          
          // Fallback: Create a simple text file
          const textContent = `
INVOICE #${invoice.number}
=======================
Customer: ${invoice.customer}
Email: ${invoice.customerEmail}
Phone: ${invoice.customerPhone}
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Status: ${invoice.status.toUpperCase()}

ITEMS:
------
${invoice.items.map(item => 
  `${item.description} x${item.quantity} @ ${formatMoney(item.unitPrice)} = ${formatMoney(item.unitPrice * item.quantity)}`
).join('\n')}

SUMMARY:
--------
Subtotal: ${formatMoney(subtotal)}
${showTax ? `${taxName} (${taxRate}%): ${formatMoney(taxAmount)}` : ''}
Total Amount: ${formatMoney(invoice.amount)}
Amount Paid: ${formatMoney(invoice.paidAmount)}
Balance Due: ${formatMoney(balanceDue)}

${invoice.notes ? `\nNotes:\n${invoice.notes}` : ''}
          `.trim();
          
          const fileName = `Invoice_${invoice.number}_${new Date().getTime()}.txt`;
          const fileUri = FileSystem.documentDirectory + fileName;
          
          await FileSystem.writeAsStringAsync(fileUri, textContent, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'text/plain',
              dialogTitle: `Invoice ${invoice.number}`,
            });
          } else {
            Alert.alert(
              'PDF Generation Failed',
              'Created text file instead. Saved to: ' + fileUri,
              [{ text: 'OK' }]
            );
          }
        }
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendInvoice = async () => {
    Alert.alert('Send Invoice', 'This would open your email client with the invoice attached.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        onPress: async () => {
          try {
            await updateInvoice(invoice.id, { status: 'sent' });
            const updatedInvoice = getInvoiceById(id as string);
            if (updatedInvoice) {
              setInvoice(updatedInvoice);
            }
            await handleDownloadPDF();
          } catch (error) {
            Alert.alert('Error', 'Failed to update invoice before sending.');
          }
        },
      },
    ]);
  };

  // Rest of the component remains the same...
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.invoiceNumber, { color: colors.text }]}>{invoice.number}</Text>
            <Text style={[
              styles.invoiceStatus, 
              { color: invoice.status === 'overdue' ? colors.error : 
                       invoice.status === 'paid' ? colors.success : 
                       invoice.status === 'pending' ? colors.warning : 
                       colors.primary500 }
            ]}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Text>
          </View>
          {canManageInvoice && (
            <TouchableOpacity onPress={handleDeleteInvoice}>
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dates */}
        <View style={[styles.datesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: colors.textTertiary }]}>Issue Date</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: colors.textTertiary }]}>Due Date</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>

        {/* Overdue Banner */}
        {invoice.status === 'overdue' && (
          <View style={[styles.overdueBanner, { backgroundColor: `${colors.error}15` }]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.overdueText, { color: colors.error }]}>
              {daysOverdue} days overdue
            </Text>
          </View>
        )}

        {/* Payment Record Section */}
        {canManageInvoice && invoice.status !== 'paid' && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Record Payment</Text>
            <View style={styles.paymentInputRow}>
              <View style={[styles.paymentInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.currencySymbol, { color: colors.text }]}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.paymentInput, { color: colors.text }]}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>
              <TouchableOpacity 
                style={[styles.recordPaymentButton, { backgroundColor: colors.primary500 }]}
                onPress={handleRecordPayment}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.recordPaymentText}>Record</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.paymentNote, { color: colors.textTertiary }]}>
              Balance Due: ${formatMoney(balanceDue)}
            </Text>
          </View>
        )}

        {/* Company Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.companyName, { color: colors.text }]}>{invoice.customer}</Text>
          <Text style={[styles.companyContact, { color: colors.text }]}>{invoice.customerEmail}</Text>
          <Text style={[styles.companyContact, { color: colors.text }]}>{invoice.customerPhone}</Text>
        </View>

        {/* Items */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Items ({invoice.items.length} Items)</Text>
          {invoice.items.map((item) => (
            <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.description}</Text>
                <Text style={[styles.itemQuantity, { color: colors.textTertiary }]}>Quantity: {item.quantity}</Text>
              </View>
              <View style={styles.itemAmount}>
                <Text style={[styles.itemPrice, { color: colors.textTertiary }]}>
                  {formatMoney(item.unitPrice)} × {item.quantity}
                </Text>
                <Text style={[styles.itemTotal, { color: colors.text }]}>
                  {formatMoney(item.unitPrice * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatMoney(subtotal)}</Text>
          </View>
          {showTax && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>
                {`${taxName} (${taxRate}%)`}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatMoney(taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>{formatMoney(invoice.amount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Amount Paid</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatMoney(invoice.paidAmount)}</Text>
          </View>
          <View style={[styles.balanceRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.balanceLabel, { color: colors.text }]}>Balance Due</Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>{formatMoney(balanceDue)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{invoice.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {canManageInvoice && invoice.status !== 'paid' && (
            <TouchableOpacity 
              style={[styles.markPaidButton, { backgroundColor: colors.success }]}
              onPress={handleMarkAsPaid}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.markPaidText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.secondaryActions}>
            {canManageInvoice && (
              <TouchableOpacity 
                style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleSendInvoice}
              >
                <Ionicons name="send-outline" size={20} color={colors.primary500} />
                <Text style={[styles.secondaryButtonText, { color: colors.primary500 }]}>Send Invoice</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Ionicons name="hourglass-outline" size={20} color={colors.primary500} />
              ) : (
                <Ionicons name="download-outline" size={20} color={colors.primary500} />
              )}
              <Text style={[styles.secondaryButtonText, { color: colors.primary500 }]}>
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  invoiceStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  datesCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  overdueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  companyContact: {
    fontSize: 14,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
  },
  balanceLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  markPaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  markPaidText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 18,
    marginBottom: 16,
  },
  // Payment input styles
  paymentInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  paymentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    marginRight: 8,
  },
  paymentInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  recordPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  recordPaymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  paymentNote: {
    fontSize: 14,
    textAlign: 'center',
  },
});

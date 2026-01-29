import { useState, useEffect } from 'react';
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export default function InvoiceDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { getInvoiceById, recordPayment, deleteInvoice, updateInvoice } = useData();
  const { user } = useUser();
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [invoice, setInvoice] = useState(getInvoiceById(id as string));
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
  const taxAmount = invoice.amount * 0.085;
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
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
      year: 'numeric'
    });
    
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.number}</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 40px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
          }
          .company-info {
            text-align: left;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-number {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 5px;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 5px;
            color: white;
          }
          .status-paid { background-color: #10B981; }
          .status-pending { background-color: #F59E0B; }
          .status-overdue { background-color: #EF4444; }
          .dates {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 15px;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .date-item {
            text-align: center;
          }
          .date-label {
            font-size: 12px;
            color: #6B7280;
            text-transform: uppercase;
          }
          .date-value {
            font-size: 14px;
            font-weight: bold;
            color: #111827;
          }
          .customer-info {
            margin: 30px 0;
            padding: 20px;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .customer-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #111827;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }
          .items-table th {
            background-color: #4F46E5;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #E5E7EB;
          }
          .items-table tr:last-child td {
            border-bottom: 2px solid #4F46E5;
          }
          .summary {
            margin: 30px 0;
            padding: 20px;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 18px;
            padding-top: 10px;
            border-top: 2px solid #4F46E5;
            margin-top: 10px;
          }
          .balance-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 20px;
            color: #EF4444;
            padding-top: 10px;
            border-top: 2px solid #EF4444;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 12px;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background-color: #FEF3C7;
            border-radius: 8px;
            border-left: 4px solid #F59E0B;
          }
          .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #92400E;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1 style="color: #4F46E5; margin: 0;">${companyName}</h1>
            <p style="margin: 5px 0; color: #6B7280;">${companyContactMarkup}</p>
          </div>
          <div class="invoice-info">
            <div class="invoice-number">Invoice #${invoice.number}</div>
            <div class="status status-${invoice.status}">${invoice.status.toUpperCase()}</div>
          </div>
        </div>
        
        <div class="dates">
          <div class="date-item">
            <div class="date-label">Issue Date</div>
            <div class="date-value">${issueDate}</div>
          </div>
          <div class="date-item">
            <div class="date-label">Due Date</div>
            <div class="date-value">${dueDate}</div>
          </div>
        </div>
        
        <div class="customer-info">
          <div class="customer-name">${invoice.customer}</div>
          <div>${invoice.customerEmail || ''}</div>
          <div>${invoice.customerPhone || ''}</div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${(item.unitPrice * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Tax (8.5%):</span>
            <span>$${taxAmount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Total Amount:</span>
            <span>$${invoice.amount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Amount Paid:</span>
            <span>$${invoice.paidAmount.toFixed(2)}</span>
          </div>
          <div class="balance-row">
            <span>Balance Due:</span>
            <span>$${balanceDue.toFixed(2)}</span>
          </div>
        </div>
        
        ${invoice.notes ? `
          <div class="notes">
            <div class="notes-title">Notes:</div>
            <div>${invoice.notes}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for your business!<br>
          Please make payment by the due date to avoid late fees.</p>
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
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
  `${item.description} x${item.quantity} @ $${item.unitPrice.toFixed(2)} = $${(item.unitPrice * item.quantity).toFixed(2)}`
).join('\n')}

SUMMARY:
--------
Subtotal: $${subtotal.toFixed(2)}
Tax (8.5%): $${taxAmount.toFixed(2)}
Total Amount: $${invoice.amount.toFixed(2)}
Amount Paid: $${invoice.paidAmount.toFixed(2)}
Balance Due: $${balanceDue.toFixed(2)}

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
          <TouchableOpacity onPress={handleDeleteInvoice}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
          </TouchableOpacity>
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
        {invoice.status !== 'paid' && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Record Payment</Text>
            <View style={styles.paymentInputRow}>
              <View style={[styles.paymentInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.currencySymbol, { color: colors.text }]}>$</Text>
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
              Balance Due: ${balanceDue.toFixed(2)}
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
                  ${item.unitPrice.toFixed(2)} × {item.quantity}
                </Text>
                <Text style={[styles.itemTotal, { color: colors.text }]}>
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Tax (8.5%)</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>${invoice.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Amount Paid</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${invoice.paidAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.balanceRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.balanceLabel, { color: colors.text }]}>Balance Due</Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>${balanceDue.toFixed(2)}</Text>
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
          {invoice.status !== 'paid' && (
            <TouchableOpacity 
              style={[styles.markPaidButton, { backgroundColor: colors.success }]}
              onPress={handleMarkAsPaid}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.markPaidText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleSendInvoice}
            >
              <Ionicons name="send-outline" size={20} color={colors.primary500} />
              <Text style={[styles.secondaryButtonText, { color: colors.primary500 }]}>Send Invoice</Text>
            </TouchableOpacity>
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

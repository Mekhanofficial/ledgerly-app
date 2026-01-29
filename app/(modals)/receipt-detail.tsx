// app/(modals)/receipt-detail.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useData } from '@/context/DataContext';
import { useUser } from '@/context/UserContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width: screenWidth } = Dimensions.get('window');

export default function ReceiptDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { getReceiptById, deleteReceipt, updateReceipt } = useData();
  const { user } = useUser();
  const { width: windowWidth } = useWindowDimensions();
  
  const [receipt, setReceipt] = useState(getReceiptById(id as string));
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (id) {
      const receiptData = getReceiptById(id as string);
      setReceipt(receiptData);
    }
  }, [id, getReceiptById]);

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
  const companyDetailLines = companyDetails.length
    ? companyDetails
    : ['support@ledgerly.com'];

  // Responsive calculations
  const isSmallScreen = windowWidth < 375;
  const isMediumScreen = windowWidth >= 375 && windowWidth < 768;
  const isLargeScreen = windowWidth >= 768;

  if (!receipt) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFound}>
          <Ionicons name="receipt-outline" size={isSmallScreen ? 48 : 64} color={colors.textTertiary} />
          <Text style={[styles.notFoundText, { color: colors.text, fontSize: isSmallScreen ? 16 : 18 }]}>
            Receipt not found
          </Text>
          <TouchableOpacity 
            style={[styles.goBackButton, { backgroundColor: colors.primary500 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: isSmallScreen ? 'short' : 'long',
      year: 'numeric',
      month: isSmallScreen ? 'short' : 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPaymentMethodIcon = (method: 'cash' | 'card' | 'transfer') => {
    switch (method) {
      case 'cash': return 'cash-outline';
      case 'card': return 'card-outline';
      case 'transfer': return 'swap-horizontal-outline';
      default: return 'card-outline';
    }
  };

  const getPaymentMethodColor = (method: 'cash' | 'card' | 'transfer') => {
    switch (method) {
      case 'cash': return colors.success;
      case 'card': return colors.primary500;
      case 'transfer': return colors.warning;
      default: return colors.primary500;
    }
  };

  const getStatusColor = (status: 'completed' | 'refunded' | 'pending') => {
    switch (status) {
      case 'completed': return colors.success;
      case 'refunded': return colors.error;
      case 'pending': return colors.warning;
      default: return colors.textTertiary;
    }
  };

  const generateReceiptHTML = () => {
    const date = formatDate(receipt.createdAt);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt ${receipt.number}</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 30px;
            color: #333;
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 5px;
          }
          .company-info {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .receipt-number {
            font-weight: bold;
            color: #111827;
            font-size: 18px;
          }
          .receipt-date {
            color: #6B7280;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 5px;
          }
          .status-completed { background-color: #10B981; color: white; }
          .status-refunded { background-color: #EF4444; color: white; }
          .status-pending { background-color: #F59E0B; color: white; }
          .customer-info {
            margin-bottom: 25px;
            padding: 15px;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .customer-name {
            font-weight: bold;
            margin-bottom: 5px;
            color: #111827;
            font-size: 18px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
          }
          .items-table th {
            background-color: #4F46E5;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
          }
          .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 14px;
          }
          .items-table tr:last-child td {
            border-bottom: 2px solid #4F46E5;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .summary {
            margin: 25px 0;
            padding: 20px;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 18px;
            padding-top: 15px;
            border-top: 2px solid #4F46E5;
            margin-top: 15px;
          }
          .payment-method {
            margin: 20px 0;
            padding: 15px;
            background-color: #F9FAFB;
            border-radius: 8px;
            text-align: center;
          }
          .payment-label {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 12px;
            line-height: 1.6;
          }
          .notes {
            margin-top: 20px;
            padding: 15px;
            background-color: #FEF3C7;
            border-radius: 8px;
            border-left: 4px solid #F59E0B;
            font-size: 13px;
          }
          .barcode {
            text-align: center;
            margin: 20px 0;
            font-family: monospace;
            letter-spacing: 8px;
            font-size: 24px;
          }
          @media print {
            body {
              margin: 0;
              padding: 10px;
            }
            .no-print {
              display: none;
            }
          }
          @media (max-width: 480px) {
            body {
              padding: 10px;
              margin: 10px;
            }
            .company-name {
              font-size: 20px;
            }
            .items-table th,
            .items-table td {
              padding: 8px 4px;
              font-size: 12px;
            }
            .summary {
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="company-info">
            ${companyContactMarkup}
          </div>
        </div>
        
        <div class="receipt-info">
          <div>
            <div class="receipt-number">${receipt.number}</div>
            <div class="receipt-date">${date}</div>
            <div class="status-badge status-${receipt.status}">${receipt.status.toUpperCase()}</div>
          </div>
        </div>
        
        <div class="customer-info">
          <div class="customer-name">${receipt.customer}</div>
          ${receipt.customerEmail ? `<div>${receipt.customerEmail}</div>` : ''}
          ${receipt.customerPhone ? `<div>${receipt.customerPhone}</div>` : ''}
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${receipt.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${formatAmount(item.price)}</td>
                <td class="text-right">${formatAmount(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>${formatAmount(receipt.subtotal)}</span>
          </div>
          ${receipt.discount > 0 ? `
            <div class="summary-row">
              <span>Discount:</span>
              <span>-${formatAmount(receipt.discount)}</span>
            </div>
          ` : ''}
          <div class="summary-row">
            <span>Tax (8.5%):</span>
            <span>${formatAmount(receipt.tax)}</span>
          </div>
          <div class="total-row">
            <span>Total Amount:</span>
            <span>${formatAmount(receipt.amount)}</span>
          </div>
        </div>
        
        <div class="payment-method">
          <div class="payment-label">PAYMENT METHOD</div>
          <div style="font-size: 18px; font-weight: bold; color: #4F46E5;">${receipt.paymentMethod.toUpperCase()}</div>
          <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">${formatAmount(receipt.amount)}</div>
        </div>
        
        <div class="barcode">
          ||||||| | || ||| | || |||||||||
        </div>
        
        ${receipt.notes ? `
          <div class="notes">
            <strong>Notes:</strong><br>
            ${receipt.notes}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Please retain this receipt for your records.</p>
          <p>Items are non-refundable. Store credit only within 30 days with receipt.</p>
          <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const htmlContent = generateReceiptHTML();
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `Receipt_${receipt.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Receipt ${receipt.number}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Success', `PDF saved to: ${uri}`);
        }
      }
      
      Alert.alert('Success', 'PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDeleteReceipt = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReceipt(receipt.id);
              router.back();
              Alert.alert('Success', 'Receipt deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  };

  const handleRefundReceipt = () => {
    Alert.alert(
      'Refund Receipt',
      'Mark this receipt as refunded?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          onPress: async () => {
            try {
              await updateReceipt(receipt.id, {
                status: 'refunded',
              });
              
              // Refresh receipt data
              const updatedReceipt = getReceiptById(id as string);
              setReceipt(updatedReceipt);
              
              Alert.alert('Success', 'Receipt marked as refunded');
            } catch (error) {
              Alert.alert('Error', 'Failed to refund receipt');
            }
          },
        },
      ]
    );
  };

  const handleResendReceipt = () => {
    Alert.alert(
      'Resend Receipt',
      'Resend this receipt to customer email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resend',
          onPress: async () => {
            // Simulate sending email
            Alert.alert('Success', 'Receipt has been sent to customer email');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[
          styles.header, 
          { 
            paddingHorizontal: isSmallScreen ? 16 : 20,
            paddingTop: isSmallScreen ? 12 : 16,
          }
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={isSmallScreen ? 20 : 24} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.headerCenter, { maxWidth: windowWidth * 0.6 }]}>
            <Text 
              style={[
                styles.receiptNumber, 
                { 
                  color: colors.text,
                  fontSize: isSmallScreen ? 18 : isMediumScreen ? 22 : 24
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {receipt.number}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(receipt.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(receipt.status) }]}>
                {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleDeleteReceipt}>
            <Ionicons name="trash-outline" size={isSmallScreen ? 20 : 24} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={[
          styles.companySection,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            marginHorizontal: isSmallScreen ? 16 : 20,
            padding: isSmallScreen ? 16 : 20,
          }
        ]}>
          <Text style={[styles.companyTitle, { color: colors.text }]} numberOfLines={1}>
            {companyName}
          </Text>
          {companyDetailLines.map((line) => (
            <Text key={line} style={[styles.companyDetail, { color: colors.textSecondary }]}>
              {line}
            </Text>
          ))}
        </View>

        {/* Receipt Info */}
        <View style={[
          styles.infoCard, 
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            marginHorizontal: isSmallScreen ? 16 : 20,
            padding: isSmallScreen ? 16 : 20,
          }
        ]}>
          <View style={[styles.infoRow, { marginBottom: isSmallScreen ? 8 : 12 }]}>
            <Text style={[styles.infoLabel, { 
              color: colors.textTertiary,
              fontSize: isSmallScreen ? 12 : 14
            }]}>
              Date & Time
            </Text>
            <Text 
              style={[styles.infoValue, { 
                color: colors.text,
                fontSize: isSmallScreen ? 14 : 16,
                maxWidth: windowWidth * 0.5
              }]}
              numberOfLines={2}
            >
              {formatDate(receipt.createdAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { 
              color: colors.textTertiary,
              fontSize: isSmallScreen ? 12 : 14
            }]}>
              Payment Method
            </Text>
            <View style={styles.paymentMethodInfo}>
              <Ionicons 
                name={getPaymentMethodIcon(receipt.paymentMethod)} 
                size={isSmallScreen ? 14 : 16} 
                color={getPaymentMethodColor(receipt.paymentMethod)} 
              />
              <Text style={[styles.paymentMethodText, { 
                color: getPaymentMethodColor(receipt.paymentMethod),
                fontSize: isSmallScreen ? 12 : 14
              }]}>
                {receipt.paymentMethod.charAt(0).toUpperCase() + receipt.paymentMethod.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={[
          styles.section, 
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            marginHorizontal: isSmallScreen ? 16 : 20,
            padding: isSmallScreen ? 16 : 20,
          }
        ]}>
          <Text style={[
            styles.sectionTitle, 
            { 
              color: colors.text,
              fontSize: isSmallScreen ? 16 : 18
            }
          ]}>
            Customer
          </Text>
          <Text 
            style={[
              styles.customerName, 
              { 
                color: colors.text,
                fontSize: isSmallScreen ? 16 : 18
              }
            ]}
            numberOfLines={2}
          >
            {receipt.customer}
          </Text>
          {receipt.customerEmail && (
            <View style={styles.customerDetail}>
              <Ionicons name="mail-outline" size={isSmallScreen ? 14 : 16} color={colors.textTertiary} />
              <Text 
                style={[styles.customerDetailText, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {receipt.customerEmail}
              </Text>
            </View>
          )}
          {receipt.customerPhone && (
            <View style={styles.customerDetail}>
              <Ionicons name="call-outline" size={isSmallScreen ? 14 : 16} color={colors.textTertiary} />
              <Text 
                style={[styles.customerDetailText, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {receipt.customerPhone}
              </Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={[
          styles.section, 
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            marginHorizontal: isSmallScreen ? 16 : 20,
            padding: isSmallScreen ? 16 : 20,
          }
        ]}>
          <Text style={[
            styles.sectionTitle, 
            { 
              color: colors.text,
              fontSize: isSmallScreen ? 16 : 18
            }
          ]}>
            Items ({receipt.items.length})
          </Text>
          {receipt.items.map((item, index) => (
            <View 
              key={item.id} 
              style={[
                styles.itemRow, 
                { 
                  borderBottomColor: colors.border,
                  paddingBottom: isSmallScreen ? 12 : 16,
                  marginBottom: isSmallScreen ? 12 : 16,
                }
              ]}
            >
              <View style={[styles.itemInfo, { flex: isSmallScreen ? 1 : undefined }]}>
                <Text 
                  style={[
                    styles.itemName, 
                    { 
                      color: colors.text,
                      fontSize: isSmallScreen ? 14 : 16
                    }
                  ]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text style={[
                  styles.itemQuantity, 
                  { 
                    color: colors.textTertiary,
                    fontSize: isSmallScreen ? 12 : 14
                  }
                ]}>
                  Quantity: {item.quantity}
                </Text>
              </View>
              <View style={[
                styles.itemAmount, 
                { 
                  minWidth: isSmallScreen ? 100 : 120,
                  alignItems: isSmallScreen ? 'flex-start' : 'flex-end'
                }
              ]}>
                <Text style={[
                  styles.itemPrice, 
                  { 
                    color: colors.textTertiary,
                    fontSize: isSmallScreen ? 12 : 14
                  }
                ]}>
                  {isSmallScreen ? (
                    `${formatAmount(item.price)} × ${item.quantity}`
                  ) : (
                    `${formatAmount(item.price)} × ${item.quantity}`
                  )}
                </Text>
                <Text style={[
                  styles.itemTotal, 
                  { 
                    color: colors.text,
                    fontSize: isSmallScreen ? 14 : 16
                  }
                ]}>
                  {formatAmount(item.price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={[
          styles.section, 
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            marginHorizontal: isSmallScreen ? 16 : 20,
            padding: isSmallScreen ? 16 : 20,
          }
        ]}>
          <Text style={[
            styles.sectionTitle, 
            { 
              color: colors.text,
              fontSize: isSmallScreen ? 16 : 18
            }
          ]}>
            Summary
          </Text>
          <View style={[styles.summaryRow, { marginBottom: isSmallScreen ? 8 : 12 }]}>
            <Text style={[
              styles.summaryLabel, 
              { 
                color: colors.text,
                fontSize: isSmallScreen ? 14 : 16
              }
            ]}>
              Subtotal
            </Text>
            <Text style={[
              styles.summaryValue, 
              { 
                color: colors.text,
                fontSize: isSmallScreen ? 14 : 16
              }
            ]}>
              {formatAmount(receipt.subtotal)}
            </Text>
          </View>
          {receipt.discount > 0 && (
            <View style={[styles.summaryRow, { marginBottom: isSmallScreen ? 8 : 12 }]}>
              <Text style={[
                styles.summaryLabel, 
                { 
                  color: colors.text,
                  fontSize: isSmallScreen ? 14 : 16
                }
              ]}>
                Discount
              </Text>
              <Text style={[
                styles.summaryValue, 
                { 
                  color: colors.error,
                  fontSize: isSmallScreen ? 14 : 16
                }
              ]}>
                -{formatAmount(receipt.discount)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, { marginBottom: isSmallScreen ? 8 : 12 }]}>
            <Text style={[
              styles.summaryLabel, 
              { 
                color: colors.text,
                fontSize: isSmallScreen ? 14 : 16
              }
            ]}>
              Tax (8.5%)
            </Text>
            <Text style={[
              styles.summaryValue, 
              { 
                color: colors.text,
                fontSize: isSmallScreen ? 14 : 16
              }
            ]}>
              {formatAmount(receipt.tax)}
            </Text>
          </View>
          <View style={[
            styles.totalRow, 
            { 
              borderTopColor: colors.border,
              paddingTop: isSmallScreen ? 12 : 16,
            }
          ]}>
            <Text style={[
              styles.totalLabel, 
              { 
                color: colors.text,
                fontSize: isSmallScreen ? 16 : 18
              }
            ]}>
              Total Amount
            </Text>
            <Text style={[
              styles.totalValue, 
              { 
                color: colors.text,
                fontSize: isSmallScreen ? 18 : 20
              }
            ]}>
              {formatAmount(receipt.amount)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {receipt.notes && (
          <View style={[
            styles.section, 
            { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              marginHorizontal: isSmallScreen ? 16 : 20,
              padding: isSmallScreen ? 16 : 20,
            }
          ]}>
            <Text style={[
              styles.sectionTitle, 
              { 
                color: colors.text,
                fontSize: isSmallScreen ? 16 : 18
              }
            ]}>
              Notes
            </Text>
            <View style={[
              styles.notesContainer, 
              { 
                backgroundColor: colors.warning + '10',
                padding: isSmallScreen ? 12 : 16,
              }
            ]}>
              <Ionicons 
                name="document-text-outline" 
                size={isSmallScreen ? 16 : 20} 
                color={colors.warning} 
              />
              <Text style={[
                styles.notesText, 
                { 
                  color: colors.text,
                  fontSize: isSmallScreen ? 12 : 14
                }
              ]}>
                {receipt.notes}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={[
          styles.actionButtons,
          { 
            paddingHorizontal: isSmallScreen ? 16 : 20,
            flexDirection: isSmallScreen ? 'column' : 'row',
            gap: isSmallScreen ? 12 : 16,
          }
        ]}>
          {receipt.status === 'completed' && (
            <TouchableOpacity 
              style={[
                styles.refundButton, 
                { 
                  backgroundColor: colors.error + '20', 
                  borderColor: colors.error,
                  flex: isSmallScreen ? 0 : 1,
                }
              ]}
              onPress={handleRefundReceipt}
            >
              <Ionicons name="arrow-undo-outline" size={20} color={colors.error} />
              <Text style={[styles.refundButtonText, { color: colors.error }]}>Refund</Text>
            </TouchableOpacity>
          )}
          
          <View style={[
            styles.secondaryActions,
            { 
              flexDirection: isSmallScreen ? 'column' : 'row',
              gap: isSmallScreen ? 8 : 8,
            }
          ]}>
            <TouchableOpacity 
              style={[
                styles.secondaryButton, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  flex: 1,
                }
              ]}
              onPress={handleResendReceipt}
              disabled={!receipt.customerEmail}
            >
              <Ionicons 
                name="send-outline" 
                size={20} 
                color={receipt.customerEmail ? colors.primary500 : colors.textTertiary} 
              />
              <Text style={[
                styles.secondaryButtonText, 
                { 
                  color: receipt.customerEmail ? colors.primary500 : colors.textTertiary,
                  fontSize: isSmallScreen ? 12 : 14
                }
              ]}>
                Resend
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.secondaryButton, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  flex: 1,
                }
              ]}
              onPress={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Ionicons name="hourglass-outline" size={20} color={colors.primary500} />
              ) : (
                <Ionicons name="download-outline" size={20} color={colors.primary500} />
              )}
              <Text style={[
                styles.secondaryButtonText, 
                { 
                  color: colors.primary500,
                  fontSize: isSmallScreen ? 12 : 14
                }
              ]}>
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Receipt ID */}
        <View style={[
          styles.receiptIdContainer,
          { paddingHorizontal: isSmallScreen ? 16 : 20 }
        ]}>
          <Text style={[styles.receiptIdLabel, { 
            color: colors.textTertiary,
            fontSize: isSmallScreen ? 10 : 12
          }]}>
            Receipt ID
          </Text>
          <Text style={[
            styles.receiptId, 
            { 
              color: colors.text,
              fontSize: isSmallScreen ? 8 : 10
            }
          ]}>
            {receipt.id}
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptNumber: {
    fontWeight: '700',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentMethodText: {
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  customerName: {
    fontWeight: '600',
    marginBottom: 12,
  },
  customerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customerDetailText: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  itemInfo: {
    flexShrink: 1,
    marginRight: 12,
  },
  itemName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQuantity: {
    fontWeight: '500',
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    marginBottom: 4,
  },
  itemTotal: {
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontWeight: '500',
  },
  summaryValue: {
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  totalLabel: {
    fontWeight: '700',
  },
  totalValue: {
    fontWeight: '700',
  },
  companySection: {
    borderRadius: 16,
    borderWidth: 1,
  },
  companyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  companyDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    gap: 12,
  },
  notesText: {
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 8,
  },
  refundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  refundButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flex: 1,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
  receiptIdContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  receiptIdLabel: {
    marginBottom: 4,
  },
  receiptId: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  spacer: {
    height: 20,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  notFoundText: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  goBackButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goBackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

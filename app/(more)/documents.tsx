import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { showMessage } from 'react-native-flash-message';
import {
  buildDocumentUrl,
  deleteDocument,
  DocumentRecord,
  fetchDocuments,
  UploadDocumentFile,
  uploadDocument,
} from '@/services/documentService';

const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

const DOCUMENT_RULES = {
  starter: {
    maxDocuments: 50,
    maxStorageBytes: 250 * MB,
    maxFileSizeBytes: 5 * MB,
    pickerTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: new Set(['pdf', 'jpg', 'jpeg', 'png']),
    imageAllowed: true,
  },
  professional: {
    maxDocuments: 1000,
    maxStorageBytes: 5 * GB,
    maxFileSizeBytes: 15 * MB,
    pickerTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/*',
    ],
    allowedExtensions: new Set(['pdf', 'docx', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'webp', 'gif']),
    imageAllowed: true,
  },
  enterprise: {
    maxDocuments: 10000,
    maxStorageBytes: 50 * GB,
    maxFileSizeBytes: 50 * MB,
    pickerTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/*',
    ],
    allowedExtensions: new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp', 'gif']),
    imageAllowed: true,
  },
} as const;

const getFileExtension = (name?: string) => {
  const fileName = String(name || '').trim().toLowerCase();
  const index = fileName.lastIndexOf('.');
  if (index < 0) return '';
  return fileName.slice(index + 1);
};

const isFileAllowedForPlan = (
  planId: 'starter' | 'professional' | 'enterprise',
  fileType?: string,
  fileName?: string
) => {
  const rule = DOCUMENT_RULES[planId];
  const mime = String(fileType || '').toLowerCase();
  const extension = getFileExtension(fileName);
  if (rule.allowedExtensions.has(extension)) return true;
  if (rule.imageAllowed && mime.startsWith('image/')) return true;
  return false;
};

const normalizePlanId = (plan?: string) => {
  if (!plan) return 'starter';
  const value = String(plan).trim().toLowerCase();
  if (value === 'pro') return 'professional';
  if (value === 'free') return 'starter';
  if (value === 'starter' || value === 'professional' || value === 'enterprise') {
    return value;
  }
  return 'starter';
};

const formatFileSize = (bytes = 0) => {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const subscriptionStatus = String(user?.business?.subscription?.status || 'active').toLowerCase();
  const planId = subscriptionStatus === 'expired'
    ? 'starter'
    : normalizePlanId(user?.business?.subscription?.plan) as 'starter' | 'professional' | 'enterprise';
  const planRule = DOCUMENT_RULES[planId] || DOCUMENT_RULES.starter;

  const totalStorageUsed = useMemo(
    () => documents.reduce((sum, doc) => sum + (Number(doc.size) || 0), 0),
    [documents]
  );
  const remainingUploads = useMemo(
    () => Math.max(0, planRule.maxDocuments - documents.length),
    [documents.length, planRule.maxDocuments]
  );
  const hasStorageCapacity = totalStorageUsed < planRule.maxStorageBytes;
  const canUploadMore = documents.length < planRule.maxDocuments && hasStorageCapacity;

  const maxDocumentSizeMb = Math.floor(planRule.maxFileSizeBytes / MB);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (error) {
      showMessage({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Unable to load documents',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (
    file: UploadDocumentFile,
    type: 'document' | 'scan'
  ) => {
    if (!canUploadMore) {
      const storageLimitText = formatFileSize(planRule.maxStorageBytes);
      Alert.alert(
        'Upgrade required',
        `Plan limit reached. ${planRule.maxDocuments} documents and ${storageLimitText} storage are included on your current plan.`
      );
      return;
    }

    const fileSize = Number(file.size) || 0;
    if (fileSize > 0 && totalStorageUsed + fileSize > planRule.maxStorageBytes) {
      showMessage({
        message: 'Upload failed',
        description: `Storage limit exceeded. Available storage: ${formatFileSize(
          Math.max(0, planRule.maxStorageBytes - totalStorageUsed)
        )}.`,
        type: 'danger',
        icon: 'danger',
      });
      return;
    }

    if (!isFileAllowedForPlan(planId, file.type, file.name)) {
      showMessage({
        message: 'Upload failed',
        description:
          planId === 'starter'
            ? 'Starter supports PDF, JPG, and PNG files only.'
            : planId === 'professional'
            ? 'Professional supports PDF, DOCX, XLSX, CSV, and image files.'
            : 'File type is not supported for your plan.',
        type: 'danger',
        icon: 'danger',
      });
      return;
    }

    if (fileSize > planRule.maxFileSizeBytes) {
      showMessage({
        message: 'Upload failed',
        description: `File is too large. Maximum supported size is ${maxDocumentSizeMb}MB.`,
        type: 'danger',
        icon: 'danger',
      });
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadDocument(file, { type });
      setDocuments((prev) => [uploaded, ...prev]);
      showMessage({
        message: 'Success',
        description: 'Document uploaded successfully.',
        type: 'success',
        icon: 'success',
      });
    } catch (error) {
      showMessage({
        message: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unable to upload document',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: planRule.pickerTypes as unknown as string[],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const webFile = (asset as any).file ?? null;
      const name = asset.name || `document-${Date.now()}.pdf`;
      const mimeType = asset.mimeType || 'application/pdf';
      const size =
        asset.size ??
        (webFile && typeof webFile.size === 'number' ? Number(webFile.size) : undefined);
      await handleUpload(
        { uri: asset.uri, name, type: mimeType, size, webFile },
        'document'
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to pick document.');
    }
  };

  const handleScanDocument = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to scan documents.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const webFile = (asset as any).file ?? null;
    const name = asset.fileName || `scan-${Date.now()}.jpg`;
    const mimeType = asset.mimeType || 'image/jpeg';
    const size =
      asset.fileSize ??
      (webFile && typeof webFile.size === 'number' ? Number(webFile.size) : undefined);
    await handleUpload(
      { uri: asset.uri, name, type: mimeType, size, webFile },
      'scan'
    );
  };

  const handleView = async (doc: DocumentRecord) => {
    const url = buildDocumentUrl(doc);
    if (!url) {
      Alert.alert('Unavailable', 'Document URL not available.');
      return;
    }
    await WebBrowser.openBrowserAsync(url);
  };

  const handleDelete = (doc: DocumentRecord) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(doc.id);
            setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
            showMessage({
              message: 'Deleted',
              description: 'Document removed successfully.',
              type: 'success',
              icon: 'success',
            });
          } catch (error) {
            showMessage({
              message: 'Error',
              description: error instanceof Error ? error.message : 'Unable to delete document',
              type: 'danger',
              icon: 'danger',
            });
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Documents</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Upload business documents and scans up to {maxDocumentSizeMb}MB each.
        </Text>
        <View
          style={[
            styles.limitBadge,
            { backgroundColor: canUploadMore ? colors.primary50 : colors.warning + '20' },
          ]}
        >
          <Ionicons
            name={canUploadMore ? 'information-circle-outline' : 'alert-circle'}
            size={16}
            color={canUploadMore ? colors.primary500 : colors.warning}
          />
          <Text style={[styles.limitText, { color: canUploadMore ? colors.primary500 : colors.warning }]}>
            {documents.length}/{planRule.maxDocuments} docs • {formatFileSize(totalStorageUsed)}/{formatFileSize(planRule.maxStorageBytes)}
          </Text>
        </View>
        <Text style={[styles.planHint, { color: colors.textTertiary }]}>
          {remainingUploads} uploads remaining on {planId.charAt(0).toUpperCase() + planId.slice(1)} plan
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.primary500 },
            (!canUploadMore || uploading) && { opacity: 0.6 },
          ]}
          onPress={handlePickDocument}
          disabled={!canUploadMore || uploading}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="white" />
          <Text style={styles.actionText}>Upload Document</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            (!canUploadMore || uploading) && { opacity: 0.6 },
          ]}
          onPress={handleScanDocument}
          disabled={!canUploadMore || uploading}
        >
          <Ionicons name="camera-outline" size={20} color={colors.primary500} />
          <Text style={[styles.actionText, { color: colors.text }]}>Scan</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.text }]}>All Documents</Text>
          <TouchableOpacity onPress={loadDocuments}>
            <Ionicons name="refresh" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.primary500} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading documents...</Text>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No documents uploaded yet.
            </Text>
          </View>
        ) : (
          documents.map((doc) => (
            <View key={doc.id} style={[styles.documentRow, { borderColor: colors.border }]}>
              <View style={styles.documentInfo}>
                <View style={[styles.documentIcon, { backgroundColor: colors.primary50 }]}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary500} />
                </View>
                <View style={styles.documentText}>
                  <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={[styles.documentMeta, { color: colors.textTertiary }]}>
                    {(doc.type === 'scan' ? 'Scan' : 'Document')} - {formatFileSize(doc.size)}
                  </Text>
                </View>
              </View>
              <View style={styles.documentActions}>
                <TouchableOpacity onPress={() => handleView(doc)} style={styles.iconButton}>
                  <Ionicons name="eye-outline" size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(doc)} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },
  planHint: {
    marginTop: 8,
    fontSize: 12,
  },
  limitBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  listCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  loading: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentText: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  documentMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  spacer: {
    height: 40,
  },
});


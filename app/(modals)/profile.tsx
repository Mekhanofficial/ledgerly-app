// app/(modals)/profile.tsx
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { router } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import { canUseBusinessLogo } from '@/utils/brandingPlan';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logoutUser, updateProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    businessName: user?.businessName || '',
    country: user?.country || '',
    timezone: user?.timezone || '',
    currencyCode: user?.currencyCode || '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(user?.profileImage || null);
  const [selectedBusinessLogo, setSelectedBusinessLogo] = useState<string | null>(user?.businessLogo || user?.business?.logo || null);
  const [businessLogoRemoved, setBusinessLogoRemoved] = useState(false);
  const canUploadBusinessLogo = canUseBusinessLogo(user || undefined);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.replace('/login');
    }
  };

  const pickMediaImage = async (onSelect: (uri: string) => void) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        onSelect(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to pick image',
        type: 'danger',
        icon: 'danger',
      });
    }
  };

  const pickImage = async () => {
    await pickMediaImage((uri) => {
      setSelectedImage(uri);
    });
  };

  const pickBusinessLogo = async () => {
    if (!canUploadBusinessLogo) {
      Alert.alert(
        'Upgrade Required',
        'Business logos are available on Professional and Enterprise plans.'
      );
      return;
    }

    await pickMediaImage((uri) => {
      setSelectedBusinessLogo(uri);
      setBusinessLogoRemoved(false);
    });
  };

  const handleRemoveBusinessLogo = () => {
    setSelectedBusinessLogo(null);
    setBusinessLogoRemoved(true);
  };

  const handleSaveChanges = async () => {
    try {
      const updates = {
        ...editedData,
        profileImage: selectedImage || undefined,
        businessLogo: selectedBusinessLogo || undefined,
        removeBusinessLogo: businessLogoRemoved,
      };

      await updateProfile(updates);
      setIsEditing(false);
      
      showMessage({
        message: 'Success',
        description: 'Profile updated successfully',
        type: 'success',
        icon: 'success',
      });
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset to original values
      setEditedData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        businessName: user?.businessName || '',
        country: user?.country || '',
        timezone: user?.timezone || '',
        currencyCode: user?.currencyCode || '',
      });
      setSelectedImage(user?.profileImage || null);
      setSelectedBusinessLogo(user?.businessLogo || user?.business?.logo || null);
      setBusinessLogoRemoved(false);
    }
    setIsEditing(!isEditing);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEditing ? 'Edit Profile' : 'Profile'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleEditToggle} style={styles.editButton}>
            <Ionicons 
              name={isEditing ? "close" : "create-outline"} 
              size={24} 
              color={colors.primary500} 
            />
          </TouchableOpacity>
        </View>

        {/* Profile Image Section */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity 
            onPress={isEditing ? pickImage : undefined}
            disabled={!isEditing}
            style={styles.profileImageWrapper}
          >
            {selectedImage ? (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary100 }]}>
                <Ionicons 
                  name="person" 
                  size={50} 
                  color={colors.primary500} 
                />
              </View>
            )}
            {isEditing && (
              <View style={[styles.editImageOverlay, { backgroundColor: colors.overlay + 'CC' }]}>
                <Ionicons name="camera" size={30} color="white" />
                <Text style={styles.editImageText}>Change Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          
        {uploadingImage && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator color="white" size="large" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        <View style={styles.businessLogoSection}>
          <Text style={[styles.businessLogoLabel, { color: colors.textSecondary }]}>Business Logo</Text>
          <TouchableOpacity
            onPress={isEditing ? pickBusinessLogo : undefined}
            disabled={!isEditing}
            style={[
              styles.businessLogoCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
          >
            {selectedBusinessLogo ? (
              <Image source={{ uri: selectedBusinessLogo }} style={styles.businessLogoImage} resizeMode="contain" />
            ) : (
              <View style={[styles.businessLogoPlaceholder, { backgroundColor: colors.primary100 }]}>
                <Ionicons name="business-outline" size={28} color={colors.primary500} />
                <Text style={[styles.businessLogoHint, { color: colors.primary500 }]}>
                  {isEditing ? 'Tap to add logo' : 'No logo uploaded'}
                </Text>
              </View>
            )}
            {isEditing && (
              <View style={[styles.businessLogoOverlay, { backgroundColor: colors.overlay + 'CC' }]}>
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.editImageText}>
                  {selectedBusinessLogo ? 'Change Logo' : 'Upload Logo'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {!canUploadBusinessLogo && (
            <Text style={[styles.planHint, { color: colors.primary500 }]}>
              Available on Professional and Enterprise. Starter users can remove an existing logo.
            </Text>
          )}
          {isEditing && selectedBusinessLogo && (
            <TouchableOpacity onPress={handleRemoveBusinessLogo} style={styles.removeLogoButton}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[styles.removeLogoText, { color: colors.error }]}>Remove Logo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

        {/* Profile Info - Editable when in edit mode */}
        {isEditing ? (
          // Edit Mode
          <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>First Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={editedData.firstName}
                onChangeText={(text) => setEditedData(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter first name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={editedData.lastName}
                onChangeText={(text) => setEditedData(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter last name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={editedData.email}
                onChangeText={(text) => setEditedData(prev => ({ ...prev, email: text }))}
                placeholder="Enter email"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={editedData.phoneNumber}
                onChangeText={(text) => setEditedData(prev => ({ ...prev, phoneNumber: text }))}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Business Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={editedData.businessName}
                onChangeText={(text) => setEditedData(prev => ({ ...prev, businessName: text }))}
                placeholder="Enter business name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Country</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={editedData.country}
                onChangeText={(text) => setEditedData(prev => ({ ...prev, country: text }))}
                placeholder="Enter country"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Timezone</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={editedData.timezone}
                onChangeText={(text) => setEditedData(prev => ({ ...prev, timezone: text }))}
                placeholder="Enter timezone"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Currency</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={editedData.currencyCode}
                onChangeText={(text) => setEditedData(prev => ({ ...prev, currencyCode: text.toUpperCase() }))}
                placeholder="Enter currency code (e.g. USD)"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary500 }]}
              onPress={handleSaveChanges}
            >
              <Ionicons name="save-outline" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // View Mode
          <>
            {/* Profile Info Display */}
            <View style={styles.profileInfoContainer}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textTertiary }]}>{user?.email}</Text>
              {user?.businessName && (
                <Text style={[styles.businessName, { color: colors.primary500 }]}>
                  {user.businessName}
                </Text>
              )}
            </View>

            {/* Contact Info */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Company Information</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{user?.email || 'No email'}</Text>
              </View>
              
              {user?.phoneNumber && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={colors.textTertiary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>{user.phoneNumber}</Text>
                </View>
              )}
              
              {user?.businessName && (
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={20} color={colors.textTertiary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>{user.businessName}</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {user?.country || 'No country set'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {user?.timezone || 'No timezone set'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {user?.currencyCode || 'No currency set'}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Action Buttons */}
        {!isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primary500 }]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

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
  editButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  profileImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageText: {
    color: 'white',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  businessLogoSection: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  businessLogoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  businessLogoCard: {
    width: 180,
    height: 110,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessLogoImage: {
    width: '100%',
    height: '100%',
  },
  businessLogoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  businessLogoHint: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  businessLogoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  removeLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  removeLogoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  spacer: {
    height: 20,
  },
});

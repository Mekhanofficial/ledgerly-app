
// app/(modals)/settings/team.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { apiGet, apiPost, apiPut } from '@/services/apiClient';
import { useUser } from '@/context/UserContext';
import { showMessage } from 'react-native-flash-message';

type TeamMember = {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions?: Record<string, any>;
  invitationAccepted?: boolean;
  isActive?: boolean;
};

type Customer = {
  _id: string;
  name: string;
  email?: string;
};

type RoleOption = {
  value: string;
  label: string;
  description: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full system control, users & roles' },
  { value: 'admin', label: 'Admin', description: 'Manage invoices, clients, reports' },
  { value: 'accountant', label: 'Accountant', description: 'Invoices, payments, financial reports' },
  { value: 'staff', label: 'Staff/Sales', description: 'Create invoices, assigned clients' },
  { value: 'client', label: 'Client', description: 'Portal access to own invoices' },
];

const summarizePermissions = (permissions: Record<string, any> = {}) => {
  const badges: string[] = [];
  Object.entries(permissions).forEach(([domain, actions]) => {
    Object.entries(actions || {}).forEach(([action, enabled]) => {
      if (enabled) {
        badges.push(`${domain}.${action}`);
      }
    });
  });
  return badges.slice(0, 4);
};

const resolveRoleLabel = (role?: string) => {
  if (!role) return 'Unknown';
  const match = ROLE_OPTIONS.find((option) => option.value === role);
  if (match) return match.label;
  return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const isProtectedAdmin = (member?: TeamMember | null) =>
  member?.role === 'super_admin' || member?.role === 'admin';

export default function TeamManagementScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const canManageTeam = user?.role === 'super_admin' || user?.role === 'admin';
  const canManageRoles = user?.role === 'super_admin';

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [savingInvite, setSavingInvite] = useState(false);
  const [processingMember, setProcessingMember] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'staff',
    customerId: '',
  });
  const [shareInvite, setShareInvite] = useState<{ url: string; email: string } | null>(null);
  const [rolePickerVisible, setRolePickerVisible] = useState(false);
  const [rolePickerMode, setRolePickerMode] = useState<'invite' | 'member'>('invite');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [customerPickerVisible, setCustomerPickerVisible] = useState(false);

  const visibleRoleOptions = useMemo(
    () => (canManageRoles ? ROLE_OPTIONS : ROLE_OPTIONS.filter((option) => option.value !== 'super_admin')),
    [canManageRoles]
  );

  useEffect(() => {
    if (!canManageTeam) {
      setLoadingTeam(false);
      return;
    }
    fetchTeam();
    fetchCustomers();
  }, [canManageTeam]);

  const fetchTeam = async () => {
    setLoadingTeam(true);
    try {
      const response: any = await apiGet('/api/v1/team');
      setTeamMembers(response?.data || []);
    } catch (error: any) {
      showMessage({
        message: 'Failed to load team',
        description: error?.message || 'Unable to fetch team members',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setLoadingTeam(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response: any = await apiGet('/api/v1/customers', { limit: 200 });
      setCustomers(response?.data || []);
    } catch (error: any) {
      showMessage({
        message: 'Failed to load customers',
        description: error?.message || 'Unable to fetch customers',
        type: 'danger',
        icon: 'danger',
      });
    }
  };

  const handleInviteSubmit = async () => {
    if (!canManageTeam) {
      showMessage({
        message: 'Access denied',
        description: 'Only admins can invite team members.',
        type: 'warning',
        icon: 'warning',
      });
      return;
    }

    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      showMessage({
        message: 'Missing details',
        description: 'Name and email are required.',
        type: 'warning',
        icon: 'warning',
      });
      return;
    }

    if (inviteForm.role === 'client' && !inviteForm.customerId) {
      showMessage({
        message: 'Customer required',
        description: 'Select a customer for client users.',
        type: 'warning',
        icon: 'warning',
      });
      return;
    }

    setSavingInvite(true);
    try {
      const payload = {
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        customerId: inviteForm.role === 'client' ? inviteForm.customerId : undefined,
      };
      const response: any = await apiPost('/api/v1/team/invite', payload);
      const inviteUrl = response?.data?.inviteUrl;
      if (inviteUrl) {
        setShareInvite({ url: inviteUrl, email: inviteForm.email.trim() });
      } else {
        setShareInvite(null);
      }
      showMessage({
        message: 'Invitation sent',
        description: response?.message || 'Invite created successfully.',
        type: 'success',
        icon: 'success',
      });
      setInviteForm({ name: '', email: '', role: 'staff', customerId: '' });
      await fetchTeam();
    } catch (error: any) {
      showMessage({
        message: 'Invite failed',
        description: error?.message || 'Unable to invite team member',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setSavingInvite(false);
    }
  };

  const updateRole = async (member: TeamMember, newRole: string) => {
    if (!canManageTeam) return;
    if (member.role === newRole) return;
    setProcessingMember(member._id);
    try {
      await apiPut(`/api/v1/team/${member._id}`, { role: newRole });
      showMessage({
        message: 'Role updated',
        description: `${member.name}'s role updated to ${resolveRoleLabel(newRole)}.`,
        type: 'success',
        icon: 'success',
      });
      await fetchTeam();
    } catch (error: any) {
      showMessage({
        message: 'Update failed',
        description: error?.message || 'Unable to update role',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setProcessingMember(null);
    }
  };

  const toggleActive = async (member: TeamMember) => {
    if (!canManageTeam) return;
    if (member.isActive === false) {
      // Reactivating is allowed
    } else if (isProtectedAdmin(member)) {
      showMessage({
        message: 'Not allowed',
        description: 'Admin accounts cannot be deactivated.',
        type: 'warning',
        icon: 'warning',
      });
      return;
    }

    setProcessingMember(member._id);
    try {
      const nextActive = !member.isActive;
      await apiPut(`/api/v1/team/${member._id}`, { isActive: nextActive });
      showMessage({
        message: nextActive ? 'Member reactivated' : 'Member deactivated',
        description: `${member.name} has been ${nextActive ? 'reactivated' : 'deactivated'}.`,
        type: 'success',
        icon: 'success',
      });
      await fetchTeam();
    } catch (error: any) {
      showMessage({
        message: 'Update failed',
        description: error?.message || 'Unable to update status',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setProcessingMember(null);
    }
  };

  const resendInvite = async (member: TeamMember) => {
    if (!canManageTeam) return;
    setProcessingMember(member._id);
    try {
      const response: any = await apiPost(`/api/v1/team/${member._id}/resend-invite`);
      const inviteUrl = response?.data?.inviteUrl;
      if (inviteUrl) {
        setShareInvite({ url: inviteUrl, email: member.email });
      }
      showMessage({
        message: 'Invitation resent',
        description: response?.message || 'Invite sent successfully.',
        type: 'success',
        icon: 'success',
      });
    } catch (error: any) {
      showMessage({
        message: 'Resend failed',
        description: error?.message || 'Unable to resend invite',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setProcessingMember(null);
    }
  };

  const openRolePicker = (mode: 'invite' | 'member', member?: TeamMember) => {
    if (mode === 'member' && member) {
      if (!canManageTeam) return;
      if (member.role === 'super_admin' && !canManageRoles) {
        showMessage({
          message: 'Not allowed',
          description: 'Only super admins can change this role.',
          type: 'warning',
          icon: 'warning',
        });
        return;
      }
      setSelectedMember(member);
    } else {
      setSelectedMember(null);
    }
    setRolePickerMode(mode);
    setRolePickerVisible(true);
  };

  const handleRoleSelected = async (role: string) => {
    setRolePickerVisible(false);
    if (rolePickerMode === 'invite') {
      setInviteForm((prev) => ({
        ...prev,
        role,
        customerId: role === 'client' ? prev.customerId : '',
      }));
      return;
    }
    if (selectedMember) {
      await updateRole(selectedMember, role);
    }
  };

  const handleShareInvite = async () => {
    if (!shareInvite?.url) return;
    try {
      await Share.share({
        message: `You are invited to Ledgerly. Click to accept: ${shareInvite.url}`,
      });
    } catch (error) {
      showMessage({
        message: 'Share failed',
        description: 'Unable to share invite link.',
        type: 'danger',
        icon: 'danger',
      });
    }
  };

  const visibleTeamMembers = canManageRoles
    ? teamMembers
    : teamMembers.filter((member) => member?.role !== 'super_admin');

  const activeCount = visibleTeamMembers.filter((member) => member.invitationAccepted && member.isActive).length;
  const invitedCount = visibleTeamMembers.length - activeCount;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.heroTitle, { color: colors.text }]}>Team & Roles</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textTertiary }]}
          >
            Invite teammates, assign roles, and control access for your business.
          </Text>
          <View style={[styles.rolePill, { backgroundColor: colors.primary50 }]}
          >
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary500} />
            <Text style={[styles.rolePillText, { color: colors.primary700 }]}
            >
              Your role: {resolveRoleLabel(user?.role)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: visibleTeamMembers.length },
            { label: 'Active', value: activeCount },
            { label: 'Invited', value: invitedCount },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Members</Text>
            <Text style={[styles.sectionMeta, { color: colors.textTertiary }]}
            >
              {canManageTeam ? 'Admin access' : 'Read-only'}
            </Text>
          </View>

          {!canManageTeam && (
            <View style={[styles.noticeCard, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}
              >
                You need admin access to view or manage team members.
              </Text>
            </View>
          )}

          {canManageTeam && loadingTeam && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary500} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading team...</Text>
            </View>
          )}

          {canManageTeam && !loadingTeam && visibleTeamMembers.length === 0 && (
            <View style={[styles.noticeCard, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="people-outline" size={20} color={colors.textTertiary} />
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}
              >
                No team members found yet.
              </Text>
            </View>
          )}

          {canManageTeam && !loadingTeam && visibleTeamMembers.map((member) => (
            <View key={member._id} style={[styles.memberCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                  <Text style={[styles.memberEmail, { color: colors.textTertiary }]}>{member.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: colors.primary50 }]}
                >
                  <Text style={[styles.roleBadgeText, { color: colors.primary700 }]}
                  >
                    {resolveRoleLabel(member.role)}
                  </Text>
                </View>
              </View>

              <View style={styles.memberMeta}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: member.invitationAccepted && member.isActive
                        ? colors.success + '20'
                        : colors.warning + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: member.invitationAccepted && member.isActive
                          ? colors.success
                          : colors.warning,
                      },
                    ]}
                  >
                    {member.invitationAccepted ? 'Active' : 'Invited'}
                  </Text>
                </View>
                {!member.isActive && (
                  <Text style={[styles.deactivatedText, { color: colors.error }]}>Deactivated</Text>
                )}
              </View>

              <View style={styles.permissionRow}>
                {summarizePermissions(member.permissions).map((tag) => (
                  <View key={tag} style={[styles.permissionTag, { backgroundColor: colors.cardSecondary }]}
                  >
                    <Text style={[styles.permissionText, { color: colors.textSecondary }]}>{tag}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.memberActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={() => openRolePicker('member', member)}
                  disabled={!canManageTeam || processingMember === member._id}
                >
                  <Ionicons name="swap-horizontal-outline" size={16} color={colors.primary500} />
                  <Text style={[styles.actionText, { color: colors.primary500 }]}>Change role</Text>
                </TouchableOpacity>

                {!member.invitationAccepted && (
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() => resendInvite(member)}
                    disabled={!canManageTeam || processingMember === member._id}
                  >
                    <Ionicons name="repeat-outline" size={16} color={colors.info} />
                    <Text style={[styles.actionText, { color: colors.info }]}>Resend invite</Text>
                  </TouchableOpacity>
                )}

                {isProtectedAdmin(member) && member.isActive ? (
                  <Text style={[styles.adminHint, { color: colors.textTertiary }]}
                  >
                    Admin accounts cannot be deactivated.
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() => toggleActive(member)}
                    disabled={!canManageTeam || processingMember === member._id}
                  >
                    <Ionicons name="remove-circle-outline" size={16} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}
                    >
                      {member.isActive ? 'Deactivate' : 'Reactivate'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Invite Teammate</Text>
          {!canManageTeam && (
            <Text style={[styles.sectionHint, { color: colors.textTertiary }]}
            >
              Only admins and super admins can invite team members.
            </Text>
          )}

          <View style={[styles.inviteCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                placeholder="Full name"
                placeholderTextColor={colors.textTertiary}
                value={inviteForm.name}
                onChangeText={(value) => setInviteForm((prev) => ({ ...prev, name: value }))}
                editable={canManageTeam}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                placeholder="team@example.com"
                placeholderTextColor={colors.textTertiary}
                value={inviteForm.email}
                onChangeText={(value) => setInviteForm((prev) => ({ ...prev, email: value }))}
                editable={canManageTeam}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Role</Text>
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: colors.input, borderColor: colors.border }]}
                onPress={() => openRolePicker('invite')}
                disabled={!canManageTeam}
              >
                <Text style={[styles.selectText, { color: colors.text }]}
                >
                  {resolveRoleLabel(inviteForm.role)}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {inviteForm.role === 'client' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Customer</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.input, borderColor: colors.border }]}
                  onPress={() => setCustomerPickerVisible(true)}
                  disabled={!canManageTeam}
                >
                  <Text style={[styles.selectText, { color: colors.text }]}
                  >
                    {customers.find((customer) => customer._id === inviteForm.customerId)?.name ||
                      'Select customer'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.inviteButton, { backgroundColor: colors.primary500 }]}
              onPress={handleInviteSubmit}
              disabled={!canManageTeam || savingInvite}
            >
              {savingInvite ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color="white" />
                  <Text style={styles.inviteButtonText}>Send invitation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {shareInvite && (
            <View style={[styles.shareCard, { backgroundColor: colors.cardSecondary }]}
            >
              <Text style={[styles.shareTitle, { color: colors.text }]}>Invite link ready</Text>
              <Text style={[styles.shareText, { color: colors.textTertiary }]}
              >
                Share this link with {shareInvite.email || 'the teammate'} if email delivery is not configured.
              </Text>
              <View style={styles.shareActions}>
                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: colors.primary500 }]}
                  onPress={handleShareInvite}
                >
                  <Ionicons name="share-social-outline" size={16} color="white" />
                  <Text style={styles.shareButtonText}>Share invite</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareButtonOutline, { borderColor: colors.border }]}
                  onPress={() => setShareInvite(null)}
                >
                  <Text style={[styles.shareButtonOutlineText, { color: colors.text }]}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      <Modal visible={rolePickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setRolePickerVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {rolePickerMode === 'invite' ? 'Select Role' : 'Update Role'}
                  </Text>
                  <TouchableOpacity onPress={() => setRolePickerVisible(false)}>
                    <Ionicons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalList}>
                  {visibleRoleOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.modalItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleRoleSelected(option.value)}
                    >
                      <View style={styles.modalItemText}>
                        <Text style={[styles.modalItemTitle, { color: colors.text }]}>{option.label}</Text>
                        <Text style={[styles.modalItemDescription, { color: colors.textTertiary }]}>
                          {option.description}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={customerPickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setCustomerPickerVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Select Customer</Text>
                  <TouchableOpacity onPress={() => setCustomerPickerVisible(false)}>
                    <Ionicons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalList}>
                  {customers.map((customer) => (
                    <TouchableOpacity
                      key={customer._id}
                      style={[styles.modalItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setInviteForm((prev) => ({ ...prev, customerId: customer._id }));
                        setCustomerPickerVisible(false);
                      }}
                    >
                      <View style={styles.modalItemText}>
                        <Text style={[styles.modalItemTitle, { color: colors.text }]}>{customer.name}</Text>
                        {customer.email ? (
                          <Text style={[styles.modalItemDescription, { color: colors.textTertiary }]}>
                            {customer.email}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                    </TouchableOpacity>
                  ))}
                  {customers.length === 0 && (
                    <View style={styles.emptyModalState}>
                      <Text style={[styles.modalItemDescription, { color: colors.textTertiary }]}>
                        No customers found.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 13,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  memberCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberEmail: {
    fontSize: 13,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deactivatedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  permissionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  permissionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  permissionText: {
    fontSize: 11,
  },
  memberActions: {
    marginTop: 14,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  adminHint: {
    fontSize: 12,
    marginTop: 4,
  },
  inviteCard: {
    borderRadius: 16,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  selectButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 15,
  },
  inviteButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  shareCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  shareText: {
    fontSize: 13,
    marginBottom: 12,
  },
  shareActions: {
    flexDirection: 'row',
    gap: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  shareButtonOutline: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  shareButtonOutlineText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalList: {
    maxHeight: 420,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalItemText: {
    flex: 1,
    paddingRight: 10,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalItemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyModalState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

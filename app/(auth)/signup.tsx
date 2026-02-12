import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { showMessage } from 'react-native-flash-message';

// Import country data (you'll need to create this or use a library)
import countryData from '@/data/countryData.json';

const { width, height } = Dimensions.get('window');

interface Country {
  name: string;
  currencyCode: string;
  currencySymbol: string;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const BUSINESS_TYPE_OPTIONS = [
  'Retail Store',
  'Service Provider',
  'Freelancer/Consultant',
  'Manufacturing',
  'Wholesale/Distribution',
  'E-commerce',
  'Restaurant/Food Service',
  'Other',
];
const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Education',
  'Finance',
  'Real Estate',
  'Hospitality',
  'Construction',
  'Transportation',
  'Entertainment',
  'Non-profit',
];

export default function SignupScreen() {
  const { colors } = useTheme();
  const { registerUser } = useUser();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    sex: '',
    country: 'United States',
    currencyCode: '',
    currencySymbol: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: '',
    industry: '',
  });
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [genderPickerVisible, setGenderPickerVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [businessTypePickerVisible, setBusinessTypePickerVisible] = useState(false);
  const [industryPickerVisible, setIndustryPickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const sortedCountries = useMemo(
    () => [...countryData].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );
  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    return query
      ? sortedCountries.filter((country) =>
          country.name.toLowerCase().includes(query)
        )
      : sortedCountries;
  }, [sortedCountries, countrySearch]);

  // Auto-populate currency when country is selected
  useEffect(() => {
    if (formData.country) {
      const selectedCountry = countryData.find(
        (country: Country) => country.name === formData.country
      );
      if (selectedCountry) {
        setFormData((prevData) => ({
          ...prevData,
          currencyCode: selectedCountry.currencyCode,
          currencySymbol: selectedCountry.currencySymbol,
        }));
      }
    }
  }, [formData.country]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const handleSelectGender = (gender: string) => {
    handleInputChange('sex', gender);
    setGenderPickerVisible(false);
  };

  const handleSelectCountry = (country: Country) => {
    handleInputChange('country', country.name);
    setCountrySearch('');
    setCountryPickerVisible(false);
  };

  const handleSelectBusinessType = (type: string) => {
    handleInputChange('businessType', type);
    setBusinessTypePickerVisible(false);
  };

  const handleSelectIndustry = (industry: string) => {
    handleInputChange('industry', industry);
    setIndustryPickerVisible(false);
  };

  const handleGenderModalClose = () => {
    setGenderPickerVisible(false);
  };

  const handleCountryModalClose = () => {
    setCountrySearch('');
    setCountryPickerVisible(false);
  };

  const handleBusinessTypeModalClose = () => {
    setBusinessTypePickerVisible(false);
  };

  const handleIndustryModalClose = () => {
    setIndustryPickerVisible(false);
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!formData.sex) {
      newErrors.sex = "Please select your gender";
    }

    if (!formData.country) {
      newErrors.country = "Please select your country";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.businessType) {
      newErrors.businessType = "Please select business type";
    }

    if (!termsAccepted) {
      newErrors.terms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSignup = async () => {
    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        businessName: formData.businessName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        sex: formData.sex,
        country: formData.country,
        currencyCode: formData.currencyCode,
        currencySymbol: formData.currencySymbol,
      };

      await registerUser(userData);
      
      // Show success message
      setRegistrationSuccess(true);
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/(auth)/login');
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      
      // Handle specific error messages
      if (errorMessage.includes("User already exists")) {
        setApiError("An account already exists with this email. Please use a different email or try logging in.");
      } else {
        setApiError(errorMessage);
      }
      
      showMessage({
        message: 'Registration Failed',
        description: errorMessage,
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2].map((step) => {
        const isActive = currentStep === step;
        const isCompleted = currentStep > step;
        return (
          <View key={step} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                { borderColor: colors.border },
                isActive && { backgroundColor: colors.primary500, borderColor: colors.primary500 },
                isCompleted && { backgroundColor: colors.primary100, borderColor: colors.primary100 },
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  { color: isActive ? 'white' : isCompleted ? colors.primary500 : colors.textTertiary },
                ]}
              >
                {step}
              </Text>
            </View>
            {step < 2 && (
              <View
                style={[
                  styles.stepLine,
                  { backgroundColor: isCompleted ? colors.primary500 : colors.border },
                ]}
              />
            )}
          </View>
        );
      })}
      <Text style={[styles.stepHint, { color: colors.textSecondary }]}>
        Step {currentStep} of 2
      </Text>
    </View>
  );

  // If registration was successful, show success message
  if (registrationSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
            <Icon name="check-circle" size={60} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Account Created Successfully!
          </Text>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            Your Ledgerly account has been created. You'll be redirected to the login page in a few seconds.
          </Text>
          <TouchableOpacity 
            style={[styles.goToLoginButton, { backgroundColor: colors.primary500 }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.goToLoginText}>Go to Login Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={isLoading}
            >
              <Icon name="chevron-left" size={28} color={colors.text} />
            </TouchableOpacity>
          <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.text }]}>
                {currentStep === 1 ? 'Create Your Account' : 'Setup Your Business'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {currentStep === 1
                  ? 'Start your 30-day free trial. No credit card required.'
                  : 'Tell us about your business to get started'}
              </Text>
          </View>
        </View>

          <StepIndicator />

          {/* API Error Message */}
          {apiError ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
              <Icon name="alert-circle-outline" size={20} color={colors.error} style={styles.errorIcon} />
              <View style={styles.errorContent}>
                <Text style={[styles.errorText, { color: colors.error }]}>{apiError}</Text>
                <View style={styles.errorActions}>
                  <TouchableOpacity onPress={() => setApiError('')}>
                    <Text style={[styles.errorActionText, { color: colors.error }]}>Dismiss</Text>
                  </TouchableOpacity>
                  {apiError.includes('already exists') && (
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                      <Text style={[styles.errorActionText, { color: colors.primary500 }]}>Go to Login</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ) : null}

          {/* Form */}
          <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>

            {currentStep === 1 ? (
              <>
                {/* Step 1: Personal Information */}
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>First Name *</Text>
                    <View style={[
                      styles.inputWrapper, { 
                        backgroundColor: colors.input,
                        borderColor: errors.firstName ? colors.error : colors.border,
                      }
                    ]}>
                      <Icon name="account-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="John"
                        placeholderTextColor={colors.textTertiary}
                        value={formData.firstName}
                        onChangeText={(value) => handleInputChange('firstName', value)}
                        editable={!isLoading}
                      />
                    </View>
                    {errors.firstName && (
                      <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.firstName}</Text>
                    )}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Last Name *</Text>
                    <View style={[
                      styles.inputWrapper, { 
                        backgroundColor: colors.input,
                        borderColor: errors.lastName ? colors.error : colors.border,
                      }
                    ]}>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Doe"
                        placeholderTextColor={colors.textTertiary}
                        value={formData.lastName}
                        onChangeText={(value) => handleInputChange('lastName', value)}
                        editable={!isLoading}
                      />
                    </View>
                    {errors.lastName && (
                      <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.lastName}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address *</Text>
                  <View style={[
                    styles.inputWrapper, { 
                      backgroundColor: colors.input,
                      borderColor: errors.email ? colors.error : colors.border,
                    }
                  ]}>
                    <Icon name="email-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="you@business.com"
                      placeholderTextColor={colors.textTertiary}
                      value={formData.email}
                      onChangeText={(value) => handleInputChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                  {errors.email && (
                    <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.email}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number *</Text>
                  <View style={[styles.inputWrapper, { 
                    backgroundColor: colors.input,
                    borderColor: errors.phoneNumber ? colors.error : colors.border,
                  }]}>
                    <Icon name="phone-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="+1 (555) 123-4567"
                      placeholderTextColor={colors.textTertiary}
                      value={formData.phoneNumber}
                      onChangeText={(value) => handleInputChange('phoneNumber', value)}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                    />
                  </View>
                  {errors.phoneNumber && (
                    <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.phoneNumber}</Text>
                  )}
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Gender *</Text>
                    <TouchableOpacity
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.input,
                          borderColor: errors.sex ? colors.error : colors.border,
                          height: 56,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setGenderPickerVisible(true)}
                      disabled={isLoading}
                    >
                      <Icon name="gender-male-female" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                      <Text
                        style={[
                          styles.dropdownText,
                          { color: formData.sex ? colors.text : colors.textTertiary },
                        ]}
                        numberOfLines={1}
                      >
                        {formData.sex || 'Select gender'}
                      </Text>
                      <Icon name="chevron-down" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                    {errors.sex && (
                      <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.sex}</Text>
                    )}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Country *</Text>
                    <TouchableOpacity
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.input,
                          borderColor: errors.country ? colors.error : colors.border,
                          height: 56,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setCountryPickerVisible(true)}
                      disabled={isLoading}
                    >
                      <Icon name="earth" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                      <Text
                        style={[
                          styles.dropdownText,
                          { color: formData.country ? colors.text : colors.textTertiary },
                        ]}
                        numberOfLines={1}
                      >
                        {formData.country || 'Select country'}
                      </Text>
                      <Icon name="chevron-down" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                    {errors.country && (
                      <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.country}</Text>
                    )}
                  </View>
                </View>

                {formData.currencyCode && (
                  <View style={[styles.currencyDisplay, { backgroundColor: colors.primary50 }]}>
                    <Text style={[styles.currencyText, { color: colors.primary700 }]}>
                      Selected currency: <Text style={styles.currencyBold}>{formData.currencyCode}</Text> ({formData.currencySymbol})
                    </Text>
                  </View>
                )}

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Password *</Text>
                    <View style={[
                      styles.inputWrapper, { 
                        backgroundColor: colors.input,
                        borderColor: errors.password ? colors.error : colors.border,
                      }
                    ]}>
                      <Icon name="lock-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text, flex: 1 }]}
                        placeholder="********"
                        placeholderTextColor={colors.textTertiary}
                        value={formData.password}
                        onChangeText={(value) => handleInputChange('password', value)}
                        secureTextEntry={securePassword}
                        editable={!isLoading}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setSecurePassword(!securePassword)}
                        disabled={isLoading}
                      >
                        <Icon 
                          name={securePassword ? "eye-outline" : "eye-off-outline"} 
                          size={20} 
                          color={colors.textTertiary} 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.password}</Text>
                    )}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm *</Text>
                    <View style={[
                      styles.inputWrapper, { 
                        backgroundColor: colors.input,
                        borderColor: errors.confirmPassword ? colors.error : colors.border,
                      }
                    ]}>
                      <Icon name="lock-check-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text, flex: 1 }]}
                        placeholder="********"
                        placeholderTextColor={colors.textTertiary}
                        value={formData.confirmPassword}
                        onChangeText={(value) => handleInputChange('confirmPassword', value)}
                        secureTextEntry={secureConfirm}
                        editable={!isLoading}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setSecureConfirm(!secureConfirm)}
                        disabled={isLoading}
                      >
                        <Icon 
                          name={secureConfirm ? "eye-outline" : "eye-off-outline"} 
                          size={20} 
                          color={colors.textTertiary} 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && (
                      <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.confirmPassword}</Text>
                    )}
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Step 2: Business Information */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Business Name *</Text>
                  <View style={[
                    styles.inputWrapper, { 
                      backgroundColor: colors.input,
                      borderColor: errors.businessName ? colors.error : colors.border,
                    }
                  ]}>
                    <Icon name="office-building-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Your Business LLC"
                      placeholderTextColor={colors.textTertiary}
                      value={formData.businessName}
                      onChangeText={(value) => handleInputChange('businessName', value)}
                      editable={!isLoading}
                    />
                  </View>
                  {errors.businessName && (
                    <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.businessName}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Business Type *</Text>
                  <TouchableOpacity
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.input,
                        borderColor: errors.businessType ? colors.error : colors.border,
                        height: 56,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setBusinessTypePickerVisible(true)}
                    disabled={isLoading}
                  >
                    <Icon name="briefcase-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: formData.businessType ? colors.text : colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {formData.businessType || 'Select business type'}
                    </Text>
                    <Icon name="chevron-down" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                  {errors.businessType && (
                    <Text style={[styles.errorTextSmall, { color: colors.error }]}>{errors.businessType}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Industry (Optional)</Text>
                  <TouchableOpacity
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        height: 56,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setIndustryPickerVisible(true)}
                    disabled={isLoading}
                  >
                    <Icon name="domain" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: formData.industry ? colors.text : colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {formData.industry || 'Select industry'}
                    </Text>
                    <Icon name="chevron-down" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.termsContainer}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <View style={[
                    styles.checkbox, 
                    { 
                      borderColor: errors.terms ? colors.error : (termsAccepted ? colors.primary500 : colors.border),
                      backgroundColor: termsAccepted ? colors.primary500 : 'transparent',
                    }
                  ]}>
                    {termsAccepted && <Icon name="check" size={14} color="white" />}
                  </View>
                  <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                    I agree to the{' '}
                    <Text style={[styles.termsLink, { color: colors.primary500 }]}>Terms of Service</Text>{' '}
                    and{' '}
                    <Text style={[styles.termsLink, { color: colors.primary500 }]}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
                {errors.terms && (
                  <Text style={[styles.errorTextSmall, { color: colors.error, marginTop: -10, marginBottom: 10 }]}>
                    {errors.terms}
                  </Text>
                )}
              </>
            )}

            {currentStep === 1 ? (
              <TouchableOpacity 
                style={[styles.signupButton, { shadowColor: colors.shadow, opacity: isLoading ? 0.7 : 1 }]} 
                onPress={handleNextStep}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[colors.primary500, colors.primary600]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signupButtonGradient}
                >
                  <Text style={styles.signupButtonText}>Continue to Business Setup</Text>
                  <Icon name="arrow-right" size={20} color="white" style={styles.buttonIcon} />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.stepActions}>
                <TouchableOpacity 
                  style={[styles.stepBackButton, { borderColor: colors.border }]}
                  onPress={handlePrevStep}
                  disabled={isLoading}
                >
                  <Icon name="arrow-left" size={18} color={colors.text} />
                  <Text style={[styles.stepBackText, { color: colors.text }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.signupButton, { shadowColor: colors.shadow, opacity: isLoading ? 0.7 : 1, flex: 1 }]} 
                  onPress={handleSignup}
                  activeOpacity={0.9}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[colors.primary500, colors.primary600]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.signupButtonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Text style={styles.signupButtonText}>Create Account</Text>
                        <Icon name="arrow-right" size={20} color="white" style={styles.buttonIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
            {currentStep === 1 && (
              <>
                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or continue with</Text>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </View>

                {/* Google Sign In */}
                <TouchableOpacity 
                  style={[styles.googleButton, { borderColor: colors.border }]}
                  disabled={isLoading}
                >
                  <Icon name="google" size={20} color="#DB4437" />
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>
                    Sign up with Google
                  </Text>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={isLoading}>
                    <Text style={[styles.footerLink, { color: colors.primary500 }]}>
                      Sign in
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={genderPickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={handleGenderModalClose}>
          <View style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Gender</Text>
                  <TouchableOpacity onPress={handleGenderModalClose}>
                    <Icon name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelectGender(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={countryPickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={handleCountryModalClose}>
          <View style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border, maxHeight: height * 0.7 }]}>
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Country</Text>
                  <TouchableOpacity onPress={handleCountryModalClose}>
                    <Icon name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[
                    styles.pickerSearchInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Search countries"
                  placeholderTextColor={colors.textTertiary}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  autoFocus
                  editable={!isLoading}
                />
                <ScrollView style={styles.pickerList}>
                  {filteredCountries.map((country) => (
                    <TouchableOpacity
                      key={country.name}
                      style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSelectCountry(country)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.text }]}>
                        {country.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={businessTypePickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={handleBusinessTypeModalClose}>
          <View style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Business Type</Text>
                  <TouchableOpacity onPress={handleBusinessTypeModalClose}>
                    <Icon name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerList}>
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSelectBusinessType(option)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.text }]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={industryPickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={handleIndustryModalClose}>
          <View style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Industry</Text>
                  <TouchableOpacity onPress={handleIndustryModalClose}>
                    <Icon name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerList}>
                  {INDUSTRY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSelectIndustry(option)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.text }]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  goToLoginButton: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
  },
  goToLoginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.06,
    paddingBottom: 20,
    minHeight: height,
  },
  header: {
    marginTop: height * 0.03,
    marginBottom: height * 0.04,
  },
  backButton: {
    marginBottom: 16,
  },
  headerContent: {
    marginTop: 8,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: width * 0.04,
    lineHeight: 22,
    maxWidth: '90%',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 6,
  },
  stepHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  errorContent: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 16,
  },
  errorActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    borderRadius: 24,
    padding: width * 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  errorTextSmall: {
    fontSize: 12,
    marginTop: 4,
  },
  currencyDisplay: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  currencyText: {
    fontSize: 14,
  },
  currencyBold: {
    fontWeight: '700',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  signupButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  signupButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  stepBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  stepBackText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 0,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pickerSearchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  pickerList: {
    maxHeight: height * 0.5,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 16,
  },
});

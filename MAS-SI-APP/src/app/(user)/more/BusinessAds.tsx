import { View, Text, ScrollView, Pressable, Dimensions, Image, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { Icon, ActivityIndicator } from 'react-native-paper'
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'expo-router'
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmissionFormSchema, submissionFormSchema, businessInfoSubmissions, BusinessInfoSchema } from '@/src/components/forms/Personal-Info'
import Animated, { 
    FadeInRight, 
    FadeOutLeft, 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming,
    FadeIn,
    FadeOut
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import ValidatedInput from '@/src/components/BusinessAdsComponets/ValidatedInput'
import BusinessAdPreview from '@/src/components/BusinessAdsComponets/BusinessAdPreview'
import { setupStripePaymentSheet, openStripePaymentSheet, fetchSavedPaymentMethods, chargeWithSavedCard, getCardBrandDisplayName, SavedPaymentMethod } from '@/src/lib/StripePaySheet'
import Confetti from '@/src/components/Confetti'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'

const { width: screenWidth } = Dimensions.get('window')

type FormField = {
    schemaId: string,
    label: string,
    placeholder: string,
    keyboardType?: 'default' | 'email-address' | 'number-pad'
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

const DURATION_OPTIONS = [
    { value: '1 Month', price: '$50', priceInCents: 5000, description: 'Perfect for trying out' },
    { value: '3 Months', price: '$135', priceInCents: 13500, description: 'Save 10%' },
    { value: '1 Year', price: '$480', priceInCents: 48000, description: 'Best value - Save 20%' },
]

const TOTAL_STEPS = 6

const STEP_CONFIG = [
    {
        title: 'Grow Your Business With Us',
        subtitle: 'Join the MAS SI community network and expand your local reach instantly.',
        fields: [],
        form: 'landing'
    },
    {
        title: 'Your Contact Info',
        subtitle: "We'll use this to reach you about your ad.",
        fields: [
            { schemaId: 'name', label: 'Full Name', placeholder: 'Enter your full name', autoCapitalize: 'words' as const },
            { schemaId: 'phoneNumber', label: 'Phone Number', placeholder: '(555) 555-5555', keyboardType: 'number-pad' as const },
            { schemaId: 'email', label: 'Email Address', placeholder: 'you@example.com', keyboardType: 'email-address' as const, autoCapitalize: 'none' as const }
        ],
        form: 'personal'
    },
    {
        title: 'About Your Business',
        subtitle: 'Tell us about your business and upload your flyer.',
        fields: [
            { schemaId: 'businessName', label: 'Business Name', placeholder: 'Enter business name', autoCapitalize: 'words' as const },
        ],
        form: 'businessWithFlyer'
    },
    {
        title: 'Business Location',
        subtitle: 'Where can customers find your business?',
        fields: [
            { schemaId: 'address', label: 'Street Address', placeholder: '123 Main Street', autoCapitalize: 'words' as const },
            { schemaId: 'city', label: 'City', placeholder: 'City', autoCapitalize: 'words' as const },
            { schemaId: 'state', label: 'State', placeholder: 'State', autoCapitalize: 'words' as const },
            { schemaId: 'businessPhoneNumber', label: 'Business Phone', placeholder: '(555) 555-5555', keyboardType: 'number-pad' as const },
            { schemaId: 'businessEmail', label: 'Business Email', placeholder: 'contact@business.com', keyboardType: 'email-address' as const, autoCapitalize: 'none' as const }
        ],
        form: 'business'
    },
    {
        title: 'Choose Your Plan',
        subtitle: 'Select how long you want your ad to run.',
        fields: [],
        form: 'ad'
    },
    {
        title: 'Review Your Ad',
        subtitle: 'Make sure everything looks good before payment.',
        fields: [],
        form: 'review'
    }
]

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 8 }}>
            {Array.from({ length: totalSteps }).map((_, index) => {
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                
                return (
                    <View
                        key={index}
                        style={{
                            width: isActive ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isActive ? '#111827' : isCompleted ? '#6B7280' : '#E5E7EB',
                        }}
                    />
                )
            })}
        </View>
    )
}

// Success screen component
const SuccessScreen = ({ onDone }: { onDone: () => void }) => {
    const confettiRef = React.useRef<{ fire: () => void }>(null)
    
    useEffect(() => {
        // Fire confetti on mount
        const timer = setTimeout(() => {
            confettiRef.current?.fire()
        }, 300)
        return () => clearTimeout(timer)
    }, [])
    
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF' }}>
            <Confetti ref={confettiRef} />
            
            <Animated.View 
                entering={FadeIn.duration(300)}
                style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: '#DCFCE7',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 32
                }}
            >
                <Icon source="check" size={56} color="#22C55E" />
            </Animated.View>
            
            <Animated.Text 
                entering={FadeIn.delay(200)}
                style={{ fontSize: 28, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 12 }}
            >
                Payment Successful!
            </Animated.Text>
            
            <Animated.Text 
                entering={FadeIn.delay(400)}
                style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 8 }}
            >
                Your business ad application has been submitted.
            </Animated.Text>
            
            <Animated.Text 
                entering={FadeIn.delay(600)}
                style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22, marginBottom: 40 }}
            >
                Our team will review your submission within 1-2 business days. You'll receive an email once your ad is approved.
            </Animated.Text>
            
            <Animated.View entering={FadeIn.delay(800)} style={{ width: '100%' }}>
                <Pressable
                    onPress={onDone}
                    style={({ pressed }) => ({
                        backgroundColor: pressed ? '#1F2937' : '#111827',
                        borderRadius: 16,
                        paddingVertical: 18,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                    })}
                >
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                        Done
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    )
}

const BusinessAds = () => {
    const { session } = useAuth()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([])
    const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null)
    const [isLoadingSavedCards, setIsLoadingSavedCards] = useState(false)
    const [saveCardForFuture, setSaveCardForFuture] = useState(false)

    // Load saved cards on mount
    useEffect(() => {
        const loadSavedCards = async () => {
            setIsLoadingSavedCards(true)
            const cards = await fetchSavedPaymentMethods()
            if (cards) {
                setSavedCards(cards)
            }
            setIsLoadingSavedCards(false)
        }
        loadSavedCards()
    }, [])

    // Phone number formatter - formats as (XXX) XXX-XXXX
    const formatPhoneNumber = (text: string) => {
        // Remove all non-numeric characters
        const cleaned = text.replace(/\D/g, '')
        
        // Limit to 10 digits
        const limited = cleaned.slice(0, 10)
        
        // Format based on length
        if (limited.length === 0) return ''
        if (limited.length <= 3) return `(${limited}`
        if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
        return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
    }

    // Animated progress bar
    const progressWidth = useSharedValue(1 / TOTAL_STEPS)
    
    const progressAnimatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progressWidth.value * 100}%`,
        }
    })

    useEffect(() => {
        progressWidth.value = withTiming((currentStep + 1) / TOTAL_STEPS, { duration: 300 })
    }, [currentStep])

    const personalMethods = useForm<SubmissionFormSchema>({
        resolver: zodResolver(submissionFormSchema),
        mode: 'onChange', // Real-time validation
    });

    const businessMethods = useForm<BusinessInfoSchema>({
        resolver: zodResolver(businessInfoSubmissions),
        mode: 'onChange', // Real-time validation
    })

    const [selectedDuration, setSelectedDuration] = useState<string>('')
    const [businessFlyer, setBusinessFlyer] = useState<ImagePicker.ImagePickerAsset>()

    // Watch form values for live preview
    const businessValues = businessMethods.watch()
    const personalValues = personalMethods.watch()

    const onSelectImage = async () => {
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        }

        const result = await ImagePicker.launchImageLibraryAsync(options)

        if (!result.canceled) {
            const img = result.assets[0]
            setBusinessFlyer(img)
        }
    }

    const saveSubmission = async () => {
        if (!businessFlyer) return false

        try {
            const base64 = await FileSystem.readAsStringAsync(businessFlyer.uri, { encoding: 'base64' });
            const filePath = `${session?.user.id}/${new Date().getTime()}.${businessFlyer.type === 'image' ? 'png' : 'mp4'}`;
            const { data: image, error: image_upload_error } = await supabase.storage.from('business_flyers').upload(filePath, decode(base64));
            
            if (image_upload_error) {
                console.log(image_upload_error)
                return false
            }

            if (image) {
                const { data: business_flyer_url } = await supabase.storage.from('business_flyers').getPublicUrl(image?.path)
                const personalInfo = personalMethods.getValues()
                const businessInfo = businessMethods.getValues()
                
                if (business_flyer_url) {
                    const { error } = await supabase.from('business_ads_submissions').insert({ 
                        'personal_full_name': personalInfo.name, 
                        'personal_phone_number': personalInfo.phoneNumber, 
                        'personal_email': personalInfo.email, 
                        'business_name': businessInfo.businessName, 
                        'business_address': businessInfo.address, 
                        'business_phone_number': businessInfo.businessPhoneNumber, 
                        'business_email': businessInfo.businessEmail, 
                        'business_flyer_duration': selectedDuration, 
                        'business_flyer_img': business_flyer_url.publicUrl, 
                        user_id: session?.user.id,
                    })
                    
                    if (error) {
                        console.log(error)
                        return false
                    }
                    
                    await supabase.functions.invoke('resend', { 
                        body: { 
                            submission: { 
                                personal_full_name: personalInfo.name, 
                                personal_phone_number: personalInfo.phoneNumber, 
                                personal_email: personalInfo.email, 
                                business_name: businessInfo.businessName, 
                                business_address: businessInfo.address, 
                                business_phone_number: businessInfo.businessPhoneNumber, 
                                business_email: businessInfo.businessEmail, 
                                business_flyer_duration: selectedDuration, 
                                business_flyer_img: business_flyer_url.publicUrl 
                            } 
                        } 
                    })
                    
                    return true
                }
            }
            return false
        } catch (error) {
            console.log(error)
            return false
        }
    }

    const handlePayment = async () => {
        if (!termsAccepted) {
            Alert.alert('Terms Required', 'Please accept the terms and conditions to continue.')
            return
        }

        const durationOption = DURATION_OPTIONS.find(d => d.value === selectedDuration)
        if (!durationOption) {
            Alert.alert('Error', 'Please select a duration.')
            return
        }

        setIsPaymentProcessing(true)
        
        try {
            let success = false

            // If a saved card is selected, charge it directly
            if (selectedSavedCard) {
                const result = await chargeWithSavedCard(selectedSavedCard, durationOption.priceInCents)
                
                if (result.success) {
                    success = true
                } else if (result.requiresAction) {
                    Alert.alert(
                        'Authentication Required',
                        'Your card requires additional verification. Please use the payment form instead.',
                        [{ text: 'OK', onPress: () => setSelectedSavedCard(null) }]
                    )
                    setIsPaymentProcessing(false)
                    return
                } else {
                    Alert.alert('Payment Failed', result.error || 'Please try again.')
                    setIsPaymentProcessing(false)
                    return
                }
            } else {
                // Use payment sheet for new card
                // Pass saveCardForFuture to determine if card should be saved
                const paymentIntent = await setupStripePaymentSheet(durationOption.priceInCents, saveCardForFuture)
                
                if (!paymentIntent) {
                    Alert.alert('Payment Error', 'Failed to initialize payment. Please try again.')
                    setIsPaymentProcessing(false)
                    return
                }

                success = await openStripePaymentSheet()
            }
            
            if (success) {
                setIsSubmitting(true)
                const saved = await saveSubmission()
                
                if (saved) {
                    setShowSuccess(true)
                } else {
                    Alert.alert('Submission Error', 'Payment was successful but we failed to save your submission. Please contact support.')
                }
            }
        } catch (error) {
            console.log('Payment error:', error)
            Alert.alert('Payment Error', 'Something went wrong. Please try again.')
        } finally {
            setIsPaymentProcessing(false)
            setIsSubmitting(false)
        }
    }

    const validateCurrentStep = useCallback((): boolean => {
        // Step 0 is landing page - no validation needed
        if (currentStep === 0) {
            return true
        } else if (currentStep === 1) {
            const values = personalMethods.getValues()
            const result = submissionFormSchema.safeParse(values)
            if (!result.success) {
                personalMethods.trigger()
                Alert.alert("Required Fields", "Please fill out all required fields to continue.")
                return false
            }
        } else if (currentStep === 2) {
            // Business name + flyer
            const values = businessMethods.getValues()
            if (!values.businessName) {
                businessMethods.trigger(['businessName'])
                Alert.alert("Required Fields", "Please enter your business name to continue.")
                return false
            }
            if (!businessFlyer) {
                Alert.alert("Missing Flyer", "Please upload a business flyer to continue.")
                return false
            }
        } else if (currentStep === 3) {
            // Location fields
            const values = businessMethods.getValues()
            const result = businessInfoSubmissions.safeParse(values)
            if (!result.success) {
                businessMethods.trigger()
                Alert.alert("Required Fields", "Please fill out all required fields to continue.")
                return false
            }
        } else if (currentStep === 4) {
            // Duration selection
            if (!selectedDuration) {
                Alert.alert("Missing Duration", "Please select an ad duration to continue.")
                return false
            }
        }
        return true
    }, [currentStep, personalMethods, businessMethods, businessFlyer, selectedDuration])

    const handleNext = () => {
        if (!validateCurrentStep()) return
        
        if (currentStep < TOTAL_STEPS - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep === 0) {
            router.back()
        } else {
            setCurrentStep(currentStep - 1)
        }
    }

    const goToStep = (step: number) => {
        setCurrentStep(step)
    }

    const handleSuccessDone = () => {
        router.back()
        router.back()
    }

    // Button is always enabled - validation happens on click
    const isButtonLoading = isSubmitting || isPaymentProcessing

    const isReviewStep = currentStep === TOTAL_STEPS - 1
    const currentConfig = STEP_CONFIG[currentStep]

    // Get field validation state
    const getFieldValidState = (form: 'personal' | 'business', fieldName: string) => {
        if (form === 'personal') {
            const value = personalMethods.watch(fieldName as keyof SubmissionFormSchema)
            const error = personalMethods.formState.errors[fieldName as keyof SubmissionFormSchema]
            return { isValid: !!value && !error, error: error?.message }
        } else {
            const value = businessMethods.watch(fieldName as keyof BusinessInfoSchema)
            const error = businessMethods.formState.errors[fieldName as keyof BusinessInfoSchema]
            return { isValid: !!value && !error, error: error?.message }
        }
    }

    const renderPersonalFields = () => {
        const fields = STEP_CONFIG[1].fields
        return fields.map((field, index) => {
            const isPhoneField = field.schemaId === 'phoneNumber'
            return (
                <Controller
                    key={index}
                    control={personalMethods.control}
                    name={field.schemaId as 'name' | 'phoneNumber' | 'email'}
                    render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
                        <ValidatedInput
                            label={field.label}
                            placeholder={field.placeholder}
                            value={value}
                            onChangeText={(text) => {
                                if (isPhoneField) {
                                    onChange(formatPhoneNumber(text))
                                } else {
                                    onChange(text)
                                }
                            }}
                            onBlur={onBlur}
                            error={fieldError?.message}
                            isValid={!!value && !fieldError}
                            keyboardType={field.keyboardType}
                            autoCapitalize={field.autoCapitalize}
                        />
                    )}
                />
            )
        })
    }

    const renderBusinessFields = (stepIndex: number) => {
        const fields = STEP_CONFIG[stepIndex].fields
        return fields.map((field, index) => {
            const isPhoneField = field.schemaId === 'businessPhoneNumber'
            return (
                <Controller
                    key={index}
                    control={businessMethods.control}
                    name={field.schemaId as 'businessName' | 'address' | 'city' | 'state' | 'businessPhoneNumber' | 'businessEmail'}
                    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                        <ValidatedInput
                            label={field.label}
                            placeholder={field.placeholder}
                            value={value}
                            onChangeText={(text) => {
                                if (isPhoneField) {
                                    onChange(formatPhoneNumber(text))
                                } else {
                                    onChange(text)
                                }
                            }}
                            onBlur={onBlur}
                            error={error?.message}
                            isValid={!!value && !error}
                            keyboardType={field.keyboardType}
                            autoCapitalize={field.autoCapitalize}
                        />
                    )}
                />
            )
        })
    }

    const benefits = [
        {
            icon: 'check-circle',
            title: 'Easy setup',
            description: 'Get your ad running in under 5 minutes',
        },
        {
            icon: 'eye',
            title: 'High visibility',
            description: 'Reach 2000+ local community members',
        },
        {
            icon: 'heart',
            title: 'Community impact',
            description: 'Support your local center while you grow',
        },
    ]

    const renderLandingStep = () => (
        <>
            {/* Hero Image Section */}
            <View 
                style={{ 
                    backgroundColor: '#F5F0E8',
                    borderRadius: 24,
                    height: 280,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    marginBottom: 32,
                }}
            >
                {/* Phone Mockup */}
                <View 
                    style={{
                        width: 200,
                        height: 240,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        elevation: 10,
                        padding: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {/* Mock Analytics Dashboard */}
                    <View style={{ width: '100%', height: '100%', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: '#374151' }}>Analytics</Text>
                            <Text style={{ fontSize: 8, color: '#9CA3AF' }}>This Week</Text>
                        </View>
                        
                        {/* Mock Chart Bars */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 100, paddingTop: 10 }}>
                            {[40, 65, 45, 80, 55, 70, 90].map((height, index) => (
                                <View 
                                    key={index}
                                    style={{
                                        width: 16,
                                        height: height,
                                        backgroundColor: index === 6 ? '#214E91' : '#E5E7EB',
                                        borderRadius: 4,
                                    }}
                                />
                            ))}
                        </View>
                        
                        {/* Mock Stats */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                            <View>
                                <Text style={{ fontSize: 8, color: '#9CA3AF' }}>Views</Text>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827' }}>2,847</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 8, color: '#9CA3AF' }}>Clicks</Text>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827' }}>384</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 8, color: '#9CA3AF' }}>Rate</Text>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#57BA47' }}>13.5%</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Benefits List */}
            <View style={{ marginBottom: 24 }}>
                {benefits.map((benefit, index) => (
                    <View 
                        key={index}
                        style={{ 
                            flexDirection: 'row', 
                            alignItems: 'flex-start',
                            marginBottom: 20,
                        }}
                    >
                        {/* Icon Container */}
                        <View 
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: '#F3F4F6',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 16,
                            }}
                        >
                            <Icon 
                                source={benefit.icon} 
                                size={22} 
                                color="#374151" 
                            />
                        </View>
                        
                        {/* Text Content */}
                        <View style={{ flex: 1 }}>
                            <Text 
                                style={{ 
                                    fontSize: 16, 
                                    fontWeight: '600', 
                                    color: '#111827',
                                    marginBottom: 4,
                                }}
                            >
                                {benefit.title}
                            </Text>
                            <Text 
                                style={{ 
                                    fontSize: 14, 
                                    color: '#6B7280',
                                    lineHeight: 20,
                                }}
                            >
                                {benefit.description}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Pricing Card */}
            <View style={{ 
                backgroundColor: '#F3F4F6', 
                borderRadius: 16, 
                padding: 20,
            }}>
                <View 
                    style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', flex: 1 }}>
                        <Text style={{ fontSize: 36, fontWeight: '700', color: '#111827' }}>$50</Text>
                        <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 4 }}>/ month</Text>
                    </View>
                </View>
                
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 12, lineHeight: 20 }}>
                    Save with 3-month or yearly plans. Cancel anytime with no hidden costs.
                </Text>
            </View>
        </>
    )

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderLandingStep()
            case 1:
                return renderPersonalFields()
            case 2:
                // Business name + flyer upload
                return (
                    <>
                        {renderBusinessFields(currentStep)}
                        {renderFlyerUpload()}
                        {/* Show live preview */}
                        <View style={{ marginTop: 24 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, textAlign: 'center' }}>
                                Live Preview
                            </Text>
                            <BusinessAdPreview
                                businessName={businessValues.businessName}
                                address={businessValues.address}
                                city={businessValues.city}
                                state={businessValues.state}
                                phoneNumber={businessValues.businessPhoneNumber}
                                email={businessValues.businessEmail}
                                imageUri={businessFlyer?.uri}
                                compact
                            />
                        </View>
                    </>
                )
            case 3:
                // Location fields
                return (
                    <>
                        {renderBusinessFields(currentStep)}
                        {/* Show live preview */}
                        <View style={{ marginTop: 24 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, textAlign: 'center' }}>
                                Live Preview
                            </Text>
                            <BusinessAdPreview
                                businessName={businessValues.businessName}
                                address={businessValues.address}
                                city={businessValues.city}
                                state={businessValues.state}
                                phoneNumber={businessValues.businessPhoneNumber}
                                email={businessValues.businessEmail}
                                imageUri={businessFlyer?.uri}
                                compact
                            />
                        </View>
                    </>
                )
            case 4:
                return renderDurationSelection()
            case 5:
                return renderReviewStep()
            default:
                return null
        }
    }

    const renderFlyerUpload = () => (
        <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                Business Flyer
            </Text>
            <Pressable onPress={onSelectImage}>
                {businessFlyer ? (
                    <View 
                        style={{ 
                            borderRadius: 16, 
                            overflow: 'hidden',
                            backgroundColor: '#1F2937',
                        }}
                    >
                        <Image 
                            source={{ uri: businessFlyer.uri }} 
                            style={{ width: '100%', height: 220, resizeMode: 'cover' }} 
                        />
                        <View style={{ padding: 12 }}>
                            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
                                {businessValues.businessName || 'Business Name'}
                            </Text>
                            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                                {businessValues.address || 'Business Address'}
                            </Text>
                        </View>
                        <View 
                            style={{ 
                                position: 'absolute', 
                                top: 12, 
                                right: 12, 
                                backgroundColor: 'rgba(0,0,0,0.6)', 
                                borderRadius: 8,
                                padding: 8,
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                                Tap to change
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View 
                        style={{
                            height: 180,
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: '#E5E7EB',
                            borderStyle: 'dashed',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#F9FAFB',
                        }}
                    >
                        <View 
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: '#E5E7EB',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <Icon source="image-plus" size={28} color="#6B7280" />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                            Upload your flyer
                        </Text>
                        <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
                            Tap to select an image
                        </Text>
                    </View>
                )}
            </Pressable>
        </View>
    )

    const renderDurationSelection = () => (
        <>
            {DURATION_OPTIONS.map((option, index) => (
                <Pressable
                    key={index}
                    onPress={() => setSelectedDuration(option.value)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: selectedDuration === option.value ? '#111827' : '#E5E7EB',
                        backgroundColor: selectedDuration === option.value ? '#F9FAFB' : '#FFFFFF',
                        marginBottom: 12,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View 
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: selectedDuration === option.value ? '#111827' : '#D1D5DB',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12,
                            }}
                        >
                            {selectedDuration === option.value && (
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#111827' }} />
                            )}
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                {option.value}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#6B7280' }}>
                                {option.description}
                            </Text>
                        </View>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                        {option.price}
                    </Text>
                </Pressable>
            ))}
        </>
    )

    const renderReviewStep = () => {
        const durationOption = DURATION_OPTIONS.find(d => d.value === selectedDuration)
        const personalInfo = personalMethods.getValues()
        const businessInfo = businessMethods.getValues()

        return (
            <>
                {/* Personal Info Section */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                            Contact Information
                        </Text>
                        <Pressable onPress={() => goToStep(1)}>
                            <Text style={{ fontSize: 14, color: '#2563EB', fontWeight: '500' }}>Edit</Text>
                        </Pressable>
                    </View>
                    <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16 }}>
                        <Text style={{ fontSize: 14, color: '#111827', marginBottom: 4 }}>{personalInfo.name}</Text>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>{personalInfo.phoneNumber}</Text>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>{personalInfo.email}</Text>
                    </View>
                </View>

                {/* Business Info Section */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                            Business Name
                        </Text>
                        <Pressable onPress={() => goToStep(2)}>
                            <Text style={{ fontSize: 14, color: '#2563EB', fontWeight: '500' }}>Edit</Text>
                        </Pressable>
                    </View>
                    <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16 }}>
                        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{businessInfo.businessName}</Text>
                    </View>
                </View>

                {/* Business Location Section */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                            Business Location
                        </Text>
                        <Pressable onPress={() => goToStep(3)}>
                            <Text style={{ fontSize: 14, color: '#2563EB', fontWeight: '500' }}>Edit</Text>
                        </Pressable>
                    </View>
                    <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16 }}>
                        <Text style={{ fontSize: 14, color: '#111827', marginBottom: 4 }}>{businessInfo.address}</Text>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>{businessInfo.city}, {businessInfo.state}</Text>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>{businessInfo.businessPhoneNumber}</Text>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>{businessInfo.businessEmail}</Text>
                    </View>
                </View>

                {/* Ad Preview */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                            Your Ad Preview
                        </Text>
                        <Pressable onPress={() => goToStep(2)}>
                            <Text style={{ fontSize: 14, color: '#2563EB', fontWeight: '500' }}>Edit</Text>
                        </Pressable>
                    </View>
                    <BusinessAdPreview
                        businessName={businessInfo.businessName}
                        address={businessInfo.address}
                        city={businessInfo.city}
                        state={businessInfo.state}
                        phoneNumber={businessInfo.businessPhoneNumber}
                        email={businessInfo.businessEmail}
                        imageUri={businessFlyer?.uri}
                    />
                </View>

                {/* Pricing Summary */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                        Payment Summary
                    </Text>
                    <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Ad Duration</Text>
                            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>{selectedDuration}</Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 16, color: '#111827', fontWeight: '600' }}>Total</Text>
                            <Text style={{ fontSize: 20, color: '#111827', fontWeight: '700' }}>{durationOption?.price}</Text>
                        </View>
                    </View>
                </View>

                {/* Saved Cards Section */}
                {savedCards.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                            Payment Method
                        </Text>
                        
                        {/* Saved Cards List */}
                        {savedCards.map((card) => (
                            <Pressable
                                key={card.id}
                                onPress={() => setSelectedSavedCard(selectedSavedCard === card.id ? null : card.id)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 16,
                                    borderRadius: 12,
                                    borderWidth: 2,
                                    borderColor: selectedSavedCard === card.id ? '#111827' : '#E5E7EB',
                                    backgroundColor: selectedSavedCard === card.id ? '#F9FAFB' : '#FFFFFF',
                                    marginBottom: 10,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon 
                                        source="credit-card-outline" 
                                        size={24} 
                                        color={selectedSavedCard === card.id ? '#111827' : '#6B7280'} 
                                    />
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                                            {getCardBrandDisplayName(card.brand)}
                                        </Text>
                                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                                            •••• {card.last4} | Expires {card.expMonth}/{card.expYear}
                                        </Text>
                                    </View>
                                </View>
                                <View 
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 11,
                                        borderWidth: 2,
                                        borderColor: selectedSavedCard === card.id ? '#111827' : '#D1D5DB',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    {selectedSavedCard === card.id && (
                                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#111827' }} />
                                    )}
                                </View>
                            </Pressable>
                        ))}

                        {/* Use New Card Option */}
                        <Pressable
                            onPress={() => setSelectedSavedCard(null)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 14,
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: '#E5E7EB',
                                borderStyle: 'dashed',
                            }}
                        >
                            <Icon source="plus" size={18} color="#2563EB" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#2563EB', marginLeft: 8 }}>
                                {selectedSavedCard ? 'Use a different card' : 'Enter card at checkout'}
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* Save Card Checkbox - only show if not using a saved card */}
                {!selectedSavedCard && (
                    <Pressable 
                        onPress={() => setSaveCardForFuture(!saveCardForFuture)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                    >
                        <View 
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                borderWidth: 2,
                                borderColor: saveCardForFuture ? '#111827' : '#D1D5DB',
                                backgroundColor: saveCardForFuture ? '#E5E7EB' : '#FFFFFF',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12,
                            }}
                        >
                            {saveCardForFuture && (
                                <Icon source="check" size={14} color="#111827" />
                            )}
                        </View>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>
                            Save card for future purchases
                        </Text>
                    </Pressable>
                )}

                {/* Terms Checkbox */}
                <Pressable 
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 }}
                >
                    <View 
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            borderWidth: 2,
                            borderColor: termsAccepted ? '#111827' : '#D1D5DB',
                            backgroundColor: termsAccepted ? '#111827' : '#FFFFFF',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                            marginTop: 2,
                        }}
                    >
                        {termsAccepted && (
                            <Icon source="check" size={16} color="#FFFFFF" />
                        )}
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                        I agree to the terms and conditions. I understand my ad will be reviewed before being posted and payment is non-refundable once the ad is approved.
                    </Text>
                </Pressable>
            </>
        )
    }

    // Show success screen
    if (showSuccess) {
        return <SuccessScreen onDone={handleSuccessDone} />
    }

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
                <StatusBar barStyle="dark-content" />
            
            {/* Custom Header */}
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingTop: insets.top + 8,
                paddingBottom: 8,
                backgroundColor: '#FFFFFF'
            }}>
                <Pressable onPress={handleBack} style={{ padding: 8 }}>
                    <Icon source="arrow-left" size={24} color="#000000" />
                </Pressable>
            </View>
            
            {/* Scrollable Content */}
            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Progress Bar */}
                <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
                    <View 
                        style={{ 
                            height: 6, 
                            backgroundColor: '#E5E7EB', 
                            borderRadius: 3,
                            overflow: 'hidden',
                        }}
                    >
                        <Animated.View 
                            style={[
                                { 
                                    height: '100%', 
                                    backgroundColor: '#111827', 
                                    borderRadius: 3,
                                },
                                progressAnimatedStyle
                            ]} 
                        />
                    </View>
                </View>

                {/* Step Content */}
                <Animated.View 
                    key={currentStep}
                    entering={FadeInRight.duration(250)} 
                    exiting={FadeOutLeft.duration(200)}
                    style={{ paddingHorizontal: 24, paddingTop: 24 }}
                >
                    {/* Step Title */}
                    <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
                        {currentConfig.title}
                    </Text>
                    <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 32, lineHeight: 24 }}>
                        {currentConfig.subtitle}
                    </Text>

                    {/* Step Content */}
                    {renderStepContent()}
                </Animated.View>
            </ScrollView>

            {/* Bottom Button */}
            <View 
                style={{
                    backgroundColor: '#FFFFFF',
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                }}
            >
                <Pressable
                    onPress={isReviewStep ? handlePayment : handleNext}
                    disabled={isButtonLoading}
                    style={{
                        backgroundColor: isButtonLoading ? '#9CA3AF' : '#111827',
                        borderRadius: 16,
                        height: 56,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {isButtonLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginRight: 8 }}>
                                {isReviewStep ? `Pay ${DURATION_OPTIONS.find(d => d.value === selectedDuration)?.price || ''}` : currentStep === 0 ? 'Start Application' : 'Continue'}
                            </Text>
                            <Icon source={isReviewStep ? "credit-card-outline" : "arrow-right"} size={20} color="#FFFFFF" />
                        </>
                    )}
                </Pressable>
            </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    )
}

export default BusinessAds

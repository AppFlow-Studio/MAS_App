import { View, Text, ScrollView, Pressable, Image, StatusBar, RefreshControl, TouchableOpacity } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { Icon, ActivityIndicator } from 'react-native-paper'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { useRouter, Stack } from 'expo-router'
import Animated, { 
    FadeIn,
    FadeInDown,
    useSharedValue, 
    useAnimatedStyle, 
    withTiming,
    withRepeat,
    withSequence,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format } from 'date-fns'
import { BusinessSubmissionsProp } from '@/src/types'
import BusinessAdPreview from '@/src/components/BusinessAdsComponets/BusinessAdPreview'

// Status step configuration
const STATUS_STEPS = [
    { key: 'RECEIVED', label: 'Submission Received' },
    { key: 'REVIEW', label: 'Under Review' },
    { key: 'DECISION', label: 'Decision Made' },
    { key: 'POSTED', label: 'Ad Posted' },
]

// Get status index for step tracker
const getStatusIndex = (status: string): number => {
    switch (status) {
        case 'SUBMITTED':
        case 'RECEIVED':
            return 1
        case 'REVIEW':
            return 2
        case 'APPROVED':
        case 'REJECT':
            return 3
        case 'POSTED':
            return 4
        default:
            return 1
    }
}

// Get status display info
const getStatusDisplay = (status: string) => {
    switch (status) {
        case 'SUBMITTED':
        case 'RECEIVED':
            return { 
                badge: 'PENDING', 
                badgeColor: '#6B7280', 
                badgeBg: '#F3F4F6',
                title: 'Application received',
                subtitle: 'Your application is in the queue'
            }
        case 'REVIEW':
            return { 
                badge: 'UNDER REVIEW', 
                badgeColor: '#2563EB', 
                badgeBg: '#DBEAFE',
                title: 'We are reviewing your ad',
                subtitle: 'Our team is reviewing your submission'
            }
        case 'APPROVED':
            return { 
                badge: 'APPROVED', 
                badgeColor: '#16A34A', 
                badgeBg: '#DCFCE7',
                title: 'Your ad is approved!',
                subtitle: 'It will be posted shortly'
            }
        case 'REJECT':
            return { 
                badge: 'REJECTED', 
                badgeColor: '#DC2626', 
                badgeBg: '#FEE2E2',
                title: 'Application not approved',
                subtitle: 'Please contact us for more details'
            }
        case 'POSTED':
            return { 
                badge: 'LIVE', 
                badgeColor: '#16A34A', 
                badgeBg: '#DCFCE7',
                title: 'Your ad is live!',
                subtitle: 'Visible to the community'
            }
        default:
            return { 
                badge: 'PENDING', 
                badgeColor: '#6B7280', 
                badgeBg: '#F3F4F6',
                title: 'Processing',
                subtitle: 'Please wait'
            }
    }
}

// Process Timeline component
const ProcessTimeline = ({ status, createdAt }: { status: string; createdAt: string }) => {
    const currentStep = getStatusIndex(status)
    const isRejected = status === 'REJECT'
    
    return (
        <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
                Process Timeline
            </Text>
            
            {STATUS_STEPS.map((step, index) => {
                const stepNumber = index + 1
                const isCompleted = stepNumber < currentStep
                const isCurrent = stepNumber === currentStep
                const isPending = stepNumber > currentStep
                const isDecisionStep = index === 2
                
                // Determine the label for decision step
                let stepLabel = step.label
                if (isDecisionStep && isRejected && (isCurrent || isCompleted)) {
                    stepLabel = 'Rejected'
                } else if (isDecisionStep && status === 'APPROVED') {
                    stepLabel = 'Approved'
                } else if (isDecisionStep && status === 'POSTED') {
                    stepLabel = 'Approved'
                }
                
                return (
                    <View key={step.key} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        {/* Timeline indicator */}
                        <View style={{ alignItems: 'center', width: 28 }}>
                            {isCompleted ? (
                                <View style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: '#22C55E',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <Icon source="check" size={14} color="#FFFFFF" />
                                </View>
                            ) : isCurrent ? (
                                <View style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: isRejected && isDecisionStep ? '#DC2626' : '#2563EB',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: '#FFFFFF',
                                    }} />
                                </View>
                            ) : (
                                <View style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: '#E5E7EB',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: '#9CA3AF',
                                    }} />
                                </View>
                            )}
                            
                            {/* Connecting line */}
                            {index < STATUS_STEPS.length - 1 && (
                                <View style={{
                                    width: 2,
                                    height: 40,
                                    backgroundColor: isCompleted ? '#22C55E' : '#E5E7EB',
                                }} />
                            )}
                        </View>
                        
                        {/* Step content */}
                        <View style={{ flex: 1, marginLeft: 12, paddingBottom: index < STATUS_STEPS.length - 1 ? 24 : 0 }}>
                            <Text style={{
                                fontSize: 15,
                                fontWeight: '600',
                                color: isPending ? '#9CA3AF' : isRejected && isDecisionStep && isCurrent ? '#DC2626' : isCurrent ? '#2563EB' : '#111827',
                            }}>
                                {stepLabel}
                            </Text>
                            {(isCompleted || isCurrent) && stepNumber === 1 && (
                                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                                    {format(new Date(createdAt), 'MMM d, h:mm a')}
                                </Text>
                            )}
                            {isCurrent && stepNumber !== 1 && (
                                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                                    Current Status
                                </Text>
                            )}
                        </View>
                    </View>
                )
            })}
        </View>
    )
}

// Application detail view component
const ApplicationDetailView = ({ 
    submission, 
    onBack, 
    onNewApplication 
}: { 
    submission: BusinessSubmissionsProp
    onBack: () => void
    onNewApplication: () => void 
}) => {
    const insets = useSafeAreaInsets()
    const statusDisplay = getStatusDisplay(submission.status)
    const currentStep = getStatusIndex(submission.status)
    const totalSteps = 4
    
    // Generate application ID from submission
    const appId = `#MAS-${submission.submission_id?.slice(-4) || submission.id?.toString().slice(-4) || '0000'}`
    
    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <StatusBar barStyle="dark-content" />
            
            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Badge */}
                <View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
                    <View style={{
                        backgroundColor: statusDisplay.badgeBg,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                    }}>
                        <Text style={{ 
                            fontSize: 12, 
                            fontWeight: '700', 
                            color: statusDisplay.badgeColor,
                            letterSpacing: 0.5,
                        }}>
                            {statusDisplay.badge}
                        </Text>
                    </View>
                </View>
                
                {/* Main Title */}
                <Text style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: 8,
                    lineHeight: 36,
                }}>
                    {statusDisplay.title}
                </Text>
                
                {/* Application ID */}
                <Text style={{
                    fontSize: 15,
                    color: '#6B7280',
                    marginBottom: 24,
                }}>
                    Ad Application {appId}
                </Text>
                
                {/* Step Progress */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                        STEP {currentStep} OF {totalSteps}
                    </Text>
                    <View style={{
                        height: 6,
                        backgroundColor: '#E5E7EB',
                        borderRadius: 3,
                        overflow: 'hidden',
                    }}>
                        <View style={{
                            height: '100%',
                            width: `${(currentStep / totalSteps) * 100}%`,
                            backgroundColor: submission.status === 'REJECT' ? '#DC2626' : '#2563EB',
                            borderRadius: 3,
                        }} />
                    </View>
                </View>
                
                {/* Estimated Time Card */}
                {(submission.status === 'REVIEW' || submission.status === 'SUBMITTED' || submission.status === 'RECEIVED') && (
                    <View style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                    }}>
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#DBEAFE',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                        }}>
                            <Icon source="clock-outline" size={20} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                                Estimated Time
                            </Text>
                            <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                                Most reviews are completed within 24-48 hours. We'll notify you via email when a decision is ready.
                            </Text>
                        </View>
                    </View>
                )}
                
                {/* Process Timeline */}
                <ProcessTimeline status={submission.status} createdAt={submission.created_at} />
                
                {/* Business Info Card */}
                <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 16,
                    padding: 16,
                    marginTop: 24,
                }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
                        BUSINESS DETAILS
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {submission.business_flyer_img && (
                            <Image 
                                source={{ uri: submission.business_flyer_img }}
                                style={{ width: 60, height: 60, borderRadius: 12, marginRight: 12 }}
                                resizeMode="cover"
                            />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                {submission.business_name}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                                {submission.business_flyer_duration}
                            </Text>
                        </View>
                    </View>
                </View>
                
                {/* Ad Preview Section */}
                <View style={{ marginTop: 32 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
                        How Your Ad Will Look
                    </Text>
                    <BusinessAdPreview
                        businessName={submission.business_name}
                        address={submission.business_address}
                        phoneNumber={submission.business_phone_number}
                        imageUri={submission.business_flyer_img}
                    />
                </View>
            </ScrollView>
        </View>
    )
}

// Empty state component
const EmptyState = ({ onStartApplication, onPreviewDemo }: { onStartApplication: () => void; onPreviewDemo: () => void }) => (
    <ScrollView 
        contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'flex-start', 
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
    >
        <Animated.View 
            entering={FadeIn.duration(400)}
            style={{ width: '100%' }}
        >
            {/* Card container */}
            <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 32,
                alignItems: 'center',
                width: '100%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
            }}>
                {/* Illustration - clipboard with magnifying glass */}
                <View style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: '#E0F2FE',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 24,
                }}>
                    <Icon source="clipboard-search-outline" size={48} color="#0EA5E9" />
                </View>
                
                <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#111827',
                    textAlign: 'center',
                    marginBottom: 8,
                }}>
                    No Application Yet
                </Text>
                
                <Text style={{
                    fontSize: 15,
                    color: '#6B7280',
                    textAlign: 'center',
                    lineHeight: 22,
                    marginBottom: 28,
                }}>
                    You haven't submitted any business ad applications. Start a new application to track its status here.
                </Text>
                
                <TouchableOpacity
                    onPress={onStartApplication}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: '#111827',
                        borderRadius: 50,
                        paddingVertical: 16,
                        paddingHorizontal: 28,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        marginTop: 4,
                    }}
                >
                    <Icon source="plus" size={20} color="#FFFFFF" />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 }}>
                        Start Application
                    </Text>
                </TouchableOpacity>
                
                {/* Demo Preview Button */}
                <TouchableOpacity
                    onPress={onPreviewDemo}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: 'transparent',
                        borderRadius: 50,
                        borderWidth: 2,
                        borderColor: '#E5E7EB',
                        paddingVertical: 14,
                        paddingHorizontal: 28,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        marginTop: 12,
                    }}
                >
                    <Icon source="eye-outline" size={20} color="#6B7280" />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginLeft: 8 }}>
                        Preview Demo
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    </ScrollView>
)

// Submission list item component
const SubmissionListItem = ({ 
    submission, 
    index, 
    onPress 
}: { 
    submission: BusinessSubmissionsProp
    index: number
    onPress: () => void 
}) => {
    const statusDisplay = getStatusDisplay(submission.status)
    
    return (
        <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
                    borderRadius: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                })}
            >
                {/* Flyer thumbnail */}
                <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: '#F3F4F6',
                    overflow: 'hidden',
                }}>
                    {submission.business_flyer_img ? (
                        <Image
                            source={{ uri: submission.business_flyer_img }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Icon source="image" size={24} color="#9CA3AF" />
                        </View>
                    )}
                </View>
                
                {/* Business info */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                        {submission.business_name || 'Untitled Business'}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                        {format(new Date(submission.created_at), 'MMM d, yyyy')}
                    </Text>
                </View>
                
                {/* Status badge and chevron */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{
                        backgroundColor: statusDisplay.badgeBg,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                    }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: statusDisplay.badgeColor }}>
                            {statusDisplay.badge}
                        </Text>
                    </View>
                    <Icon source="chevron-right" size={20} color="#9CA3AF" />
                </View>
            </Pressable>
        </Animated.View>
    )
}

// Demo data for preview
const DEMO_SUBMISSION: BusinessSubmissionsProp = {
    personal_full_name: 'John Doe',
    personal_phone_number: '(555) 123-4567',
    personal_email: 'john@example.com',
    business_name: "Joe's Pizza & Grill",
    business_address: '123 Victory Blvd, Staten Island, NY 10301',
    business_phone_number: '(718) 555-1234',
    business_flyer_duration: '3 Months',
    business_flyer_location: '',
    business_flyer_img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
    user_id: 'demo',
    status: 'REVIEW',
    created_at: new Date().toISOString(),
    submission_id: 'demo-1234',
}

const BusinessStatus = () => {
    const { session } = useAuth()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    
    const [submissions, setSubmissions] = useState<BusinessSubmissionsProp[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedSubmission, setSelectedSubmission] = useState<BusinessSubmissionsProp | null>(null)
    const [showDemo, setShowDemo] = useState(false)
    
    const fetchSubmissions = async () => {
        if (!session?.user?.id) {
            setIsLoading(false)
            return
        }
        
        try {
            const { data, error } = await supabase
                .from('business_ads_submissions')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
            
            if (data) {
                setSubmissions(data)
                // Update selected submission if it exists
                if (selectedSubmission) {
                    const updated = data.find(s => s.submission_id === selectedSubmission.submission_id)
                    if (updated) setSelectedSubmission(updated)
                }
            }
            if (error) {
                console.log('Error fetching submissions:', error)
            }
        } catch (err) {
            console.log('Error:', err)
        } finally {
            setIsLoading(false)
        }
    }
    
    useEffect(() => {
        // Always call fetchSubmissions - it handles the no-session case
        fetchSubmissions()
        
        // Only set up real-time subscription if we have a session
        if (!session?.user?.id) return
        
        const channel = supabase
            .channel('business_status_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'business_ads_submissions',
                filter: `user_id=eq.${session.user.id}`
            }, () => {
                fetchSubmissions()
            })
            .subscribe()
        
        return () => {
            supabase.removeChannel(channel)
        }
    }, [session?.user?.id])
    
    // Safety: ensure we don't stay in loading state forever
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false)
            }
        }, 5000)
        return () => clearTimeout(timeout)
    }, [])
    
    const onRefresh = useCallback(() => {
        setRefreshing(true)
        fetchSubmissions().finally(() => setRefreshing(false))
    }, [])
    
    const handleBack = () => {
        router.back()
    }
    
    const handleStartApplication = () => {
        router.replace('/more/BusinessAds')
    }
    
    // Show demo view
    if (showDemo) {
        return (
            <ApplicationDetailView 
                submission={DEMO_SUBMISSION}
                onBack={() => setShowDemo(false)}
                onNewApplication={handleStartApplication}
            />
        )
    }
    
    // If a submission is selected, show detail view
    if (selectedSubmission) {
        return (
            <ApplicationDetailView 
                submission={selectedSubmission}
                onBack={() => setSelectedSubmission(null)}
                onNewApplication={handleStartApplication}
            />
        )
    }
    
    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#111827" />
            </View>
        )
    }
    
    // If only one submission, go directly to detail view
    if (submissions.length === 1 && !selectedSubmission) {
        return (
            <ApplicationDetailView 
                submission={submissions[0]}
                onBack={handleBack}
                onNewApplication={handleStartApplication}
            />
        )
    }
    
    return (
        <View style={{ flex: 1, backgroundColor: submissions.length === 0 ? '#F9FAFB' : '#FFFFFF' }}>
            <StatusBar barStyle="dark-content" />
            
            {submissions.length === 0 ? (
                <EmptyState onStartApplication={handleStartApplication} onPreviewDemo={() => setShowDemo(true)} />
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#111827"
                        />
                    }
                >
                    {/* Applications list */}
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
                        {submissions.length} application{submissions.length !== 1 ? 's' : ''}
                    </Text>
                    
                    {submissions.map((submission, index) => (
                        <SubmissionListItem
                            key={submission.submission_id || index}
                            submission={submission}
                            index={index}
                            onPress={() => setSelectedSubmission(submission)}
                        />
                    ))}
                    
                    {/* New application button */}
                    <Pressable
                        onPress={handleStartApplication}
                        style={({ pressed }) => ({
                            backgroundColor: pressed ? '#F3F4F6' : '#FFFFFF',
                            borderRadius: 14,
                            borderWidth: 2,
                            borderColor: '#E5E7EB',
                            borderStyle: 'dashed',
                            paddingVertical: 16,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 4,
                        })}
                    >
                        <Icon source="plus" size={20} color="#6B7280" />
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280', marginLeft: 8 }}>
                            New Application
                        </Text>
                    </Pressable>
                </ScrollView>
            )}
        </View>
    )
}

export default BusinessStatus

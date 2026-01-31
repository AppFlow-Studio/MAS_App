import {
    PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import PaymentSuccessPopup from '@/src/components/PaymentSuccessPopup';

const PENDING_CHECKOUT_SESSION_KEY = '@BusinessAds/pending_checkout_session_id';

type SubscriptionState = {
    wasCancelled: boolean;
};

type DeepLinkContextData = {
    subscriptionState: SubscriptionState;
    clearSubscriptionState: () => void;
    /** True after the subscription payment-success popup was closed (so BusinessAds can reset form). */
    paymentSuccessJustClosed: boolean;
    clearPaymentSuccessJustClosed: () => void;
    /** Fallback: show payment-success popup when BusinessAds focuses and launch URL is subscription-success (in case deep link was missed). */
    showPaymentSuccessPopup: (sessionId: string) => void;
};

const initialSubscriptionState: SubscriptionState = {
    wasCancelled: false,
};

/** Extract session_id from Stripe success URL (works for any URL format). */
function extractSessionIdFromUrl(url: string): string | null {
    const match = url.match(/session_id=([^&\s]+)/);
    if (match) return decodeURIComponent(match[1].trim());
    return null;
}

/** Check if URL is subscription-success (custom scheme or universal link). */
function isSubscriptionSuccessUrl(url: string): boolean {
    return url.includes('subscription-success');
}

/** Check if URL is subscription-cancel. */
function isSubscriptionCancelUrl(url: string): boolean {
    return url.includes('subscription-cancel');
}

const DeepLinkContext = createContext<DeepLinkContextData>({
    subscriptionState: initialSubscriptionState,
    clearSubscriptionState: () => {},
    paymentSuccessJustClosed: false,
    clearPaymentSuccessJustClosed: () => {},
    showPaymentSuccessPopup: () => {},
});

export default function DeepLinkProvider({ children }: PropsWithChildren) {
    const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(initialSubscriptionState);
    const [paymentSuccessSessionId, setPaymentSuccessSessionId] = useState<string | null>(null);
    const [paymentSuccessJustClosed, setPaymentSuccessJustClosed] = useState(false);
    const router = useRouter();
    const hasHandledInitialUrl = useRef(false);
    const lastShownSessionIdRef = useRef<string | null>(null);

    const clearSubscriptionState = useCallback(() => {
        setSubscriptionState(initialSubscriptionState);
    }, []);

    const clearPaymentSuccessJustClosed = useCallback(() => {
        setPaymentSuccessJustClosed(false);
    }, []);

    const showPaymentSuccessPopup = useCallback((sessionId: string) => {
        console.log('showPaymentSuccessPopup called with:', sessionId);
        console.log('lastShownSessionIdRef:', lastShownSessionIdRef.current);
        if (lastShownSessionIdRef.current === sessionId) {
            console.log('Skipping - already shown this session');
            return;
        }
        lastShownSessionIdRef.current = sessionId;
        console.log('Setting paymentSuccessSessionId to show popup');
        setPaymentSuccessSessionId(sessionId);
    }, []);

    const handleDeepLink = useCallback((url: string) => {
        console.log('DeepLinkProvider: Received URL:', url);

        // Handle subscription success: show popup and call verifySubscriptionSession (in PaymentSuccessPopup)
        if (isSubscriptionSuccessUrl(url)) {
            const sessionId = extractSessionIdFromUrl(url);
            console.log('DeepLinkProvider: Showing payment success popup with sessionId:', sessionId ?? 'null');
            if (sessionId) {
                // Clear pending session since deep link fired successfully
                AsyncStorage.removeItem(PENDING_CHECKOUT_SESSION_KEY).catch(() => {});
                lastShownSessionIdRef.current = sessionId;
                setPaymentSuccessSessionId(sessionId);
            }
            WebBrowser.dismissBrowser().catch(() => {});
            return;
        }

        if (isSubscriptionCancelUrl(url)) {
            console.log('DeepLinkProvider: Subscription cancelled');
            // Clear pending session on cancel too
            AsyncStorage.removeItem(PENDING_CHECKOUT_SESSION_KEY).catch(() => {});
            setSubscriptionState({ wasCancelled: true });
        }
    }, []);

    useEffect(() => {
        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        // Cold start: getInitialURL() is the only way to get the URL that launched the app
        Linking.getInitialURL().then((url) => {
            if (url && !hasHandledInitialUrl.current) {
                hasHandledInitialUrl.current = true;
                console.log('DeepLinkProvider: Initial URL (cold start):', url);
                handleDeepLink(url);
            }
        });

        return () => subscription.remove();
    }, [handleDeepLink]);

    // Fallback: When app becomes active, check for pending checkout session (in case deep link didn't fire)
    useEffect(() => {
        const checkPendingCheckoutSession = async () => {
            try {
                const pendingSessionId = await AsyncStorage.getItem(PENDING_CHECKOUT_SESSION_KEY);
                if (pendingSessionId && lastShownSessionIdRef.current !== pendingSessionId) {
                    console.log('DeepLinkProvider: Found pending checkout session:', pendingSessionId);
                    // Clear it first to prevent re-triggering
                    await AsyncStorage.removeItem(PENDING_CHECKOUT_SESSION_KEY);
                    lastShownSessionIdRef.current = pendingSessionId;
                    setPaymentSuccessSessionId(pendingSessionId);
                }
            } catch (error) {
                console.log('DeepLinkProvider: Error checking pending session:', error);
            }
        };

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                console.log('DeepLinkProvider: App became active, checking for pending checkout session');
                checkPendingCheckoutSession();
            }
        };

        // Check on mount too (in case app was killed and relaunched)
        checkPendingCheckoutSession();

        const appStateSub = AppState.addEventListener('change', handleAppStateChange);
        return () => appStateSub.remove();
    }, []);

    const closePopup = useCallback(() => {
        // Just close the popup (used on error - user can retry)
        setPaymentSuccessSessionId(null);
    }, []);

    const goToStatus = useCallback(() => {
        // Close popup and signal success (triggers navigation in BusinessAds)
        setPaymentSuccessSessionId(null);
        setPaymentSuccessJustClosed(true);
        router.replace('/more/BusinessStatus');
    }, [router]);

    return (
        <DeepLinkContext.Provider
            value={{ 
                subscriptionState, 
                clearSubscriptionState,
                paymentSuccessJustClosed,
                clearPaymentSuccessJustClosed,
                showPaymentSuccessPopup,
            }}
        >
            {children}
            {paymentSuccessSessionId !== null && (
                <PaymentSuccessPopup
                    sessionId={paymentSuccessSessionId}
                    onClose={closePopup}
                    onGoToStatus={goToStatus}
                />
            )}
        </DeepLinkContext.Provider>
    );
}

export const useDeepLink = () => useContext(DeepLinkContext);

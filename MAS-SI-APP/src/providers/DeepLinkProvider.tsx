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

const PENDING_CHECKOUT_SESSION_KEY = '@BusinessAds/pending_checkout_session_id';

type SubscriptionState = {
    wasCancelled: boolean;
};

type DeepLinkContextData = {
    subscriptionState: SubscriptionState;
    clearSubscriptionState: () => void;
    navigateToPaymentProcessing: (sessionId: string) => void;
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
    navigateToPaymentProcessing: () => {},
});

export default function DeepLinkProvider({ children }: PropsWithChildren) {
    const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(initialSubscriptionState);
    const router = useRouter();
    const hasHandledInitialUrl = useRef(false);
    const lastHandledSessionIdRef = useRef<string | null>(null);

    const clearSubscriptionState = useCallback(() => {
        setSubscriptionState(initialSubscriptionState);
    }, []);

    // Navigate to PaymentProcessing screen with the session ID
    const navigateToPaymentProcessing = useCallback((sessionId: string) => {
        console.log('DeepLinkProvider: Navigating to PaymentProcessing with session:', sessionId);
        if (lastHandledSessionIdRef.current === sessionId) {
            console.log('DeepLinkProvider: Skipping - already handled this session');
            return;
        }
        lastHandledSessionIdRef.current = sessionId;
        
        // Clear the pending session from AsyncStorage
        AsyncStorage.removeItem(PENDING_CHECKOUT_SESSION_KEY).catch(() => {});
        
        // Navigate to PaymentProcessing screen
        router.replace({
            pathname: '/more/PaymentProcessing',
            params: { sessionId }
        });
    }, [router]);

    const handleDeepLink = useCallback((url: string) => {
        console.log('DeepLinkProvider: Received URL:', url);

        // Handle subscription success via deep link
        if (isSubscriptionSuccessUrl(url)) {
            const sessionId = extractSessionIdFromUrl(url);
            console.log('DeepLinkProvider: Subscription success URL with sessionId:', sessionId ?? 'null');
            if (sessionId) {
                WebBrowser.dismissBrowser().catch(() => {});
                navigateToPaymentProcessing(sessionId);
            }
            return;
        }

        // Handle subscription cancel
        if (isSubscriptionCancelUrl(url)) {
            console.log('DeepLinkProvider: Subscription cancelled');
            AsyncStorage.removeItem(PENDING_CHECKOUT_SESSION_KEY).catch(() => {});
            setSubscriptionState({ wasCancelled: true });
            WebBrowser.dismissBrowser().catch(() => {});
        }
    }, [navigateToPaymentProcessing]);

    // Listen for deep links
    useEffect(() => {
        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        // Check for initial URL on cold start
        Linking.getInitialURL().then((url) => {
            if (url && !hasHandledInitialUrl.current) {
                hasHandledInitialUrl.current = true;
                console.log('DeepLinkProvider: Initial URL (cold start):', url);
                handleDeepLink(url);
            }
        });

        return () => subscription.remove();
    }, [handleDeepLink]);

    // Fallback: When app becomes active, check for pending checkout session
    // This handles the case where the app was killed while user was in Safari
    useEffect(() => {
        const checkPendingCheckoutSession = async () => {
            try {
                const pendingSessionId = await AsyncStorage.getItem(PENDING_CHECKOUT_SESSION_KEY);
                if (pendingSessionId && lastHandledSessionIdRef.current !== pendingSessionId) {
                    console.log('DeepLinkProvider: Found pending checkout session on app active:', pendingSessionId);
                    navigateToPaymentProcessing(pendingSessionId);
                }
            } catch (error) {
                console.log('DeepLinkProvider: Error checking pending session:', error);
            }
        };

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                console.log('DeepLinkProvider: App became active, checking for pending checkout session');
                // Small delay to let navigation settle
                setTimeout(() => {
                    checkPendingCheckoutSession();
                }, 500);
            }
        };

        // Check on mount (in case app was restored)
        const initialCheck = setTimeout(() => {
            checkPendingCheckoutSession();
        }, 1000);

        const appStateSub = AppState.addEventListener('change', handleAppStateChange);
        
        return () => {
            clearTimeout(initialCheck);
            appStateSub.remove();
        };
    }, [navigateToPaymentProcessing]);

    return (
        <DeepLinkContext.Provider
            value={{ 
                subscriptionState, 
                clearSubscriptionState,
                navigateToPaymentProcessing,
            }}
        >
            {children}
        </DeepLinkContext.Provider>
    );
}

export const useDeepLink = () => useContext(DeepLinkContext);

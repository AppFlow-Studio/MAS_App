import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
const supabaseURL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON!
const AdminClientkey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE!
export const supabase = createClient(supabaseURL, supabaseAnonKey, {
    auth : {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    }
});

export const AdminClient = createClient(supabaseURL, AdminClientkey, {
    auth : {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    }
});
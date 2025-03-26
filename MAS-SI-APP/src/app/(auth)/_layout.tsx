import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';

const UserAuthStack = () => {
  const { session, loading } = useAuth(); // ✅ loading must come from your AuthProvider

  if (loading) return null; // ✅ Don't render anything until session is checked

  if (session) {
    return <Redirect href="/(user)" />;
  }

  return <Stack />;
};

export default UserAuthStack;

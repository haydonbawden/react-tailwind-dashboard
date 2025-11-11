import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase, SupabaseSession, SupabaseError } from "../lib/supabaseClient";
import { Profile, UserRole } from "../types/models";

type AuthContextValue = {
  session: SupabaseSession | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: SupabaseError | null }>;
  signOut: () => Promise<void>;
  signUp: (
    input: {
      email: string;
      password: string;
      role?: UserRole;
      given_name?: string;
      family_name?: string;
      phone?: string;
      org_id?: string;
    },
  ) => Promise<{ error: SupabaseError | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const handleSupabaseError = (error: SupabaseError | null): SupabaseError | null => {
  if (!error) return null;
  return {
    message: error.message ?? "An error occurred",
    code: error.code,
    status: error.status,
  };
};

const emptyProfile: Profile = {
  id: "",
  user_id: "",
  org_id: null,
  role: "ClientRep",
  given_name: "",
  family_name: "",
  email: "",
  status: "Pending",
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setIsLoading(false);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from<Profile>("profiles")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load profile", error);
      setProfile({ ...emptyProfile, user_id: session.user.id, email: session.user.email });
    } else {
      setProfile(data);
    }
    setIsLoading(false);
  }, [session?.user?.email, session?.user?.id]);

  useEffect(() => {
    loadSession();
    const { data } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [loadSession]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const signIn = useCallback(
    async (credentials: { email: string; password: string }) => {
      setIsLoading(true);
      const result = await supabase.auth.signInWithPassword(credentials);
      setSession(result.data.session);
      if (result.data.session) {
        await loadProfile();
      } else {
        setIsLoading(false);
      }
      return { error: handleSupabaseError(result.error) };
    },
    [loadProfile],
  );

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      role?: UserRole;
      given_name?: string;
      family_name?: string;
      phone?: string;
      org_id?: string;
    }) => {
      setIsLoading(true);
      const result = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        data: {
          role: input.role ?? "ClientRep",
          given_name: input.given_name,
          family_name: input.family_name,
          phone: input.phone,
          org_id: input.org_id,
        },
      });
      setSession(result.data.session);
      if (result.data.session) {
        await loadProfile();
      } else {
        setIsLoading(false);
      }
      return { error: handleSupabaseError(result.error) };
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      session,
      profile,
      isLoading,
      signIn,
      signOut,
      signUp,
      refreshProfile: loadProfile,
    }),
    [session, profile, isLoading, signIn, signOut, signUp, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

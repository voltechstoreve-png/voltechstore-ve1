'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  email_personal?: string;
  rol: 'admin' | 'socio' | 'empleado';
  whatsapp?: string;
  foto_url?: string;
  pin?: string;
  estado?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, pin: string) => Promise<{ error: any }>;
  signUp: (userData: SignUpData) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  nombre: string;
  apellido: string;
  emailPersonal: string;
  whatsapp: string;
  password: string;
  pin: string;
  foto_url?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    try {
      // ✅ CAMBIO: Usar .limit(1) en lugar de .single()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      // ✅ CAMBIO: Tomar el primer elemento del array
      if (data && data.length > 0) {
        setProfile(data[0]);
      } else {
        console.warn('No se encontró perfil para el usuario:', userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string, pin: string) => {
    try {
      console.log('🔐 Intentando login con:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error de autenticación:', error.message);
        throw error;
      }

      console.log('✅ Usuario autenticado:', data.user?.id);

      // Verificar PIN y estado
      if (data.user) {
        // ✅ CAMBIO: Usar .limit(1) en lugar de .single()
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('pin, estado, rol')
          .eq('id', data.user.id)
          .limit(1);

        if (profileError) {
          console.error('❌ Error buscando perfil:', profileError.message);
          await supabase.auth.signOut();
          return { error: { message: 'Error al buscar tu perfil' } };
        }

        // ✅ CAMBIO: Verificar que haya datos y tomar el primer elemento
        if (!profileData || profileData.length === 0) {
          console.error('❌ No se encontró perfil para el usuario');
          await supabase.auth.signOut();
          return { error: { message: 'No se encontró tu perfil' } };
        }

        const profile = profileData[0]; // ✅ Tomar el primer elemento
        console.log('📋 Datos del perfil:', profile);

        if (profile?.estado !== 'activo') {
          console.error('❌ Cuenta no activa. Estado:', profile?.estado);
          await supabase.auth.signOut();
          return { error: { message: 'Tu cuenta aún no ha sido aprobada por el administrador' } };
        }

        if (profile?.pin !== pin) {
          console.error('❌ PIN incorrecto. Esperado:', profile?.pin, 'Recibido:', pin);
          await supabase.auth.signOut();
          return { error: { message: 'PIN incorrecto' } };
        }

        console.log('✅ Login exitoso!');
      }

      return { error: null };
    } catch (error: any) {
      console.error('❌ Error en signIn:', error);
      return { error };
    }
  };

  const signUp = async (userData: SignUpData) => {
    try {
      // Generar correo corporativo: primera inicial + apellido + @voltechstore.ve
      const inicial = userData.nombre.charAt(0).toLowerCase();
      const apellido = userData.apellido.toLowerCase().replace(/\s/g, '');
      const emailCorporativo = `${inicial}${apellido}@voltechstore.ve`;

      console.log('📝 Registrando usuario:', emailCorporativo);

      // Crear usuario en Supabase con el email corporativo
      const { data, error } = await supabase.auth.signUp({
        email: emailCorporativo,
        password: userData.password,
        options: {
          data: {
            nombre: userData.nombre,
            apellido: userData.apellido,
          }
        }
      });

      if (error) {
        console.error('❌ Error en signUp:', error.message);
        throw error;
      }

      console.log('✅ Usuario creado en auth:', data.user?.id);

      if (data.user) {
        // Guardar perfil con ambos emails
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            nombre: userData.nombre,
            apellido: userData.apellido,
            email: emailCorporativo,
            email_personal: userData.emailPersonal,
            whatsapp: userData.whatsapp,
            foto_url: userData.foto_url || null,
            pin: userData.pin,
            rol: 'empleado',
            estado: 'pendiente',
            created_at: new Date().toISOString(),
          }]);

        if (profileError) {
          console.error('❌ Error creando perfil:', profileError.message);
          throw profileError;
        }

        console.log('✅ Perfil creado exitosamente');
      }

      return { error: null };
    } catch (error: any) {
      console.error('❌ Error en signUp:', error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
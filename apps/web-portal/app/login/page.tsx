'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import api from '@/lib/axios';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data.user;
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      console.log('Login exitoso, bienvenido:', response.data.user.fullName);
      console.log('ROL DETECTADO:', userData.role);
      
      if (userData.role === 'ADMIN') {
        router.push('/admin'); 
      } else {
        router.push('/');  
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="relative flex min-h-screen items-center justify-center p-4">
      
      {/* 2. IMAGEN DE FONDO (uce_entrada.png) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/uce_entrada.png" 
          alt="Entrada Universidad Central del Ecuador"
          fill
          className="object-cover"
          priority
          unoptimized={true}
        />
        {/* 3. CAPA OSCURA: bg-black/60 para que el texto resalte sobre el cielo y la entrada */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* 4. TARJETA DE LOGIN: z-10 para estar encima y efecto vidrio (backdrop-blur) */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-slate-200">
        
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-900">Bienvenido</h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">Inicia sesión en el portal RVRS</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Correo @uce.edu.ec</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black bg-white"
              placeholder="usuario@uce.edu.ec"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black bg-white"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white rounded-lg font-bold shadow-lg transition-all transform active:scale-[0.98] ${
              loading 
                ? 'bg-blue-400 cursor-wait' 
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 font-medium">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-blue-700 hover:underline font-bold">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
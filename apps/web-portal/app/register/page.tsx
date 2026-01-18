'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Para la redirección
import api from '@/lib/axios'; // Tu instancia de Axios configurada

export default function RegisterPage() {
  const router = useRouter(); // Inicializamos el router
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT'
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Estado para bloquear el botón mientras carga

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validación local antes de enviar
    if (!formData.email.endsWith('@uce.edu.ec')) {
      setError('Solo se permiten correos institucionales @uce.edu.ec');
      setLoading(false);
      return;
    }

    try {
      console.log('📡 Intentando registrar en el backend:', formData);
      
      // Petición real al backend
      const response = await api.post('/auth/register', formData);
      
      if (response.status === 201 || response.status === 200) {
        console.log('✅ Usuario creado:', response.data);
        alert('¡Registro exitoso! Redirigiendo al login...');
        
        // REDIRECCIÓN: Nos manda a la página de login
        router.push('/login');
      }
    } catch (err: any) {
      console.error('❌ Error capturado:', err);
      
      // Extraemos el error que devuelve tu Express (si existe)
      const serverMessage = err.response?.data?.error || 'Error de conexión con el servidor';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Crear Cuenta</h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">Sistema RVRS - Universidad Central</p>
        </div>

        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Nombre Completo</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
              placeholder="Ej. Damian Quezada"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Correo Institucional</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
              placeholder="usuario@uce.edu.ec"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
              placeholder="Mínimo 6 caracteres"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Tipo de Usuario</label>
            <select 
              className="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black font-medium"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="STUDENT">Estudiante</option>
              <option value="PROFESSOR">Docente</option>
            </select>
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
            {loading ? 'Procesando...' : 'Finalizar Registro'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 font-medium">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-700 hover:underline font-bold">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
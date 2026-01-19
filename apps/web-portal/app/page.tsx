'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import { apiCommand, apiQuery } from '@/lib/axios';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; fullName: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Estados para el Modal y Datos
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [complaintData, setComplaintData] = useState({
    title: '',
    description: '',
    building: 'FACULTAD_INGENIERIA',
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);

  // 1. Manejo de Sesión
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (activeTab === 'denuncias') fetchMyComplaints(parsedUser.id);
    }
  }, [router, activeTab]);

  // 2. Previsualización
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // 3. Obtener Denuncias
  const fetchMyComplaints = async (userId: string) => {
    try {
      const response = await apiQuery.get(`/complaints/user/${userId}`);
      setMyComplaints(response.data);
    } catch (error) {
      console.error("Error cargando denuncias:", error);
    }
  };

  // 4. Logout
  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // 5. Enviar Denuncia
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Por favor, adjunta evidencia.");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', complaintData.title);
      formData.append('description', complaintData.description);
      formData.append('building', complaintData.building);
      formData.append('evidenceType', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
      formData.append('userId', user?.id || '');
      formData.append('evidence', file);

      await apiCommand.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('✅ Denuncia enviada exitosamente.');
      setComplaintData({ title: '', description: '', building: 'FACULTAD_INGENIERIA' });
      setFile(null);
      setActiveTab('denuncias');
    } catch (err) {
      console.error(err);
      alert('❌ Error al enviar la denuncia');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="flex h-screen items-center justify-center text-blue-900 font-bold">Cargando sesión...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      
      {/* ==================================================================
          1. HEADER INSTITUCIONAL (NUEVO DISEÑO CON LOGO GRANDE)
          z-40 para que se quede fijo pero debajo del modal (que es z-50)
      ================================================================== */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 shadow-lg text-white sticky top-0 z-40 transition-all">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo y Título */}
          <div className="flex items-center gap-4">
            {/* 🔥 CAMBIO AQUI: Aumenté de w-12 h-12 a w-20 h-20 (aprox 80px) */}
            <div className="bg-white/95 p-1 rounded-full shadow-md flex items-center justify-center w-16 h-16 md:w-20 md:h-20 transition-all hover:scale-105">
              <Image 
                src="/UCE_logo.png" 
                alt="Logo UCE" 
                width={70} // Aumentado para llenar el nuevo contenedor
                height={70} 
                className="object-contain" 
                unoptimized={true}
              />
            </div>
            <div className="leading-tight">
              {/* Texto ligeramente más grande también */}
              <h1 className="text-xl md:text-2xl font-extrabold tracking-wide">RVRS UCE</h1>
              <p className="text-xs md:text-sm text-blue-100 font-medium opacity-90">
                Sistema de Denuncias Estudiantil
              </p>
            </div>
          </div>

          {/* Usuario y Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold">{user.fullName}</p>
              <p className="text-xs text-blue-200">{user.role === 'STUDENT' ? 'Estudiante' : 'Docente'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/10 rounded-lg transition-all shadow-sm active:scale-95"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================================
          2. NAVEGACIÓN (TABS)
      ================================================================== */}
      <nav className="bg-white border-b sticky top-[88px] md:top-[104px] z-30 shadow-sm transition-all">
        <div className="container mx-auto px-4 flex gap-6 overflow-x-auto">
          {['home', 'dashboard', 'denuncias'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 font-bold capitalize border-b-4 transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-blue-700 text-blue-800' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'denuncias' ? 'Mis Denuncias' : tab === 'dashboard' ? 'Nueva Denuncia' : 'Inicio'}
            </button>
          ))}
        </div>
      </nav>

      {/* ==================================================================
          3. CONTENIDO PRINCIPAL
      ================================================================== */}
      <main className="p-6 max-w-4xl mx-auto mb-20">
        
        {/* PESTAÑA: NUEVA DENUNCIA (FORMULARIO) */}
        {activeTab === 'dashboard' && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-extrabold mb-8 text-blue-900 border-b pb-2">Registrar Incidente</h2>
            <form onSubmit={handleSubmitComplaint} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Título del incidente</label>
                <input 
                  required
                  className="w-full p-4 border rounded-xl bg-slate-50 text-black outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                  placeholder="Ej: Acoso verbal en laboratorios"
                  value={complaintData.title}
                  onChange={(e) => setComplaintData({...complaintData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Facultad / Edificio</label>
                <select 
                  className="w-full p-4 border rounded-xl bg-slate-50 text-black outline-none shadow-sm focus:ring-2 focus:ring-blue-500"
                  value={complaintData.building}
                  onChange={(e) => setComplaintData({...complaintData, building: e.target.value})}
                >
                  <option value="FACULTAD_INGENIERIA">Facultad de Ingeniería</option>
                  <option value="FACULTAD_ADMINISTRACION">Facultad de Administración</option>
                  <option value="FACULTAD_JURISPRUDENCIA">Facultad de Jurisprudencia</option>
                  <option value="BIBLIOTECA_CENTRAL">Biblioteca Central</option>
                  <option value="ESTADIO_UNIVERSITARIO">Estadio Universitario</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descripción detallada</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full p-4 border rounded-xl bg-slate-50 text-black outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Relate lo sucedido..."
                  value={complaintData.description}
                  onChange={(e) => setComplaintData({...complaintData, description: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Evidencia (Obligatorio)</label>
                <div className="flex flex-col gap-4">
                  {previewUrl ? (
                    <div className="w-full h-64 relative bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-200 group">
                      {file?.type.startsWith('video') ? (
                        <video src={previewUrl} controls className="max-h-full" />
                      ) : (
                        <img src={previewUrl} alt="Preview" className="max-h-full object-contain" />
                      )}
                      <button 
                        type="button"
                        onClick={() => setFile(null)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 text-xs shadow-lg transition-transform hover:scale-110"
                      >
                        ✕ Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-blue-200 rounded-xl p-8 bg-blue-50 hover:bg-blue-100 transition-all flex flex-col items-center justify-center cursor-pointer group">
                      <input 
                        type="file" 
                        required
                        accept="image/*,video/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                      />
                      <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📷</span>
                      <span className="text-blue-600 font-bold">Subir Imagen o Video</span>
                      <p className="text-xs text-blue-400 mt-1">Máximo 50MB</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-800 transition-all shadow-lg active:scale-[0.98] disabled:bg-blue-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? (
                    <>⏳ Enviando...</>
                ) : (
                    <>🚀 Enviar Denuncia</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* PESTAÑA: LISTA DE DENUNCIAS */}
        {activeTab === 'denuncias' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Historial de Denuncias</h2>
            {myComplaints.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 text-lg">No has registrado denuncias aún.</p>
              </div>
            ) : (
              myComplaints.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center hover:shadow-md hover:border-blue-200 transition-all gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">{c.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                        <span className="text-xs font-bold text-slate-300">•</span>
                        <p className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded uppercase">
                            {c.building.replaceAll('_', ' ')}
                        </p>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                      c.status === 'RECEIVED' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {c.status}
                    </span>

                    {c.aiStatus === 'PROCESSED' ? (
                        <button 
                            onClick={() => setSelectedComplaint(c)}
                            className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-95"
                        >
                            <span>🧠</span> Ver Análisis IA
                        </button>
                    ) : (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 animate-pulse bg-slate-50 px-2 py-1 rounded">
                            ⏳ Procesando IA...
                        </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PESTAÑA: HOME (INICIO) */}
        {activeTab === 'home' && (
             <div className="py-16 text-center animate-in zoom-in duration-500">
                 <div className="inline-block p-4 rounded-full bg-blue-50 mb-6 shadow-xl">
                    <Image src="/UCE_logo.png" width={100} height={100} alt="Logo Grande" className="object-contain" />
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black text-blue-900 mb-6 tracking-tight">PORTAL RVRS</h2>
                 <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                   Bienvenido al Sistema de Reporte de Vulnerabilidades y Riesgos de Seguridad. 
                   <br />
                   Tu participación es vital para mantener un campus seguro.
                 </p>
                 <div className="mt-10">
                     <button onClick={() => setActiveTab('dashboard')} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-xl hover:bg-blue-700 transition-transform hover:scale-105">
                         Comenzar Reporte
                     </button>
                 </div>
             </div>
        )}
      </main>

      {/* ==================================================================
          4. MODAL DE INTELIGENCIA ARTIFICIAL (POPUP)
          z-50 Para estar encima del header
      ================================================================== */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Encabezado del Modal */}
            <div className="bg-blue-900 p-6 flex justify-between items-center text-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    🤖 Análisis de IA
                </h3>
                <p className="text-blue-200 text-xs mt-1 font-mono opacity-80">ID: {selectedComplaint.id}</p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8 space-y-8">
              
              {/* Sección de Métricas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Nivel de Gravedad</p>
                  <p className={`text-2xl font-black ${
                    selectedComplaint.aiSeverity === 'HIGH' ? 'text-red-600' : 
                    selectedComplaint.aiSeverity === 'MEDIUM' ? 'text-orange-500' : 'text-green-600'
                  }`}>
                    {selectedComplaint.aiSeverity === 'HIGH' ? '🔴 ALTA' : 
                     selectedComplaint.aiSeverity === 'MEDIUM' ? '🟠 MEDIA' : '🟢 BAJA'}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Puntaje de Riesgo</p>
                  <div className="flex items-end justify-center gap-1">
                      <p className="text-3xl font-black text-blue-900">{selectedComplaint.aiScore || 0}</p>
                      <span className="text-sm text-slate-400 font-bold mb-1">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Sanción Sugerida */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-xl shadow-sm">
                <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  ⚖️ Sanción Sugerida
                </h4>
                <p className="text-yellow-900 font-medium text-lg leading-tight">
                  {selectedComplaint.suggestedSanction || "Pendiente de revisión"}
                </p>
              </div>

              {/* Razonamiento Detallado */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    📋 Razonamiento del Modelo
                </h4>
                <div className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm text-justify">
                  {selectedComplaint.analysisJson?.reasoning || 
                   selectedComplaint.analysisJson?.summary || 
                   selectedComplaint.analysisJson?.explanation ||
                   "No hay detalles adicionales disponibles."}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setSelectedComplaint(null)}
                  className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
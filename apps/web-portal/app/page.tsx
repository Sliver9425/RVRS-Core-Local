'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCommand, apiQuery } from '@/lib/axios';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; fullName: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // 🔥🔥🔥 1. NUEVO ESTADO PARA EL MODAL DE ANÁLISIS 🔥🔥🔥
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  const [complaintData, setComplaintData] = useState({
    title: '',
    description: '',
    building: 'FACULTAD_INGENIERIA',
  });

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);

  // 1. Manejo de Sesión y Carga de Datos
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

  // 4. Enviar Denuncia
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

  if (!user) return <div className="p-8 text-black">Cargando sesión...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      
      {/* 🔥🔥🔥 2. EL MODAL (VENTANA EMERGENTE) 🔥🔥🔥 */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Encabezado del Modal */}
            <div className="bg-blue-900 p-6 flex justify-between items-center text-white rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold">Análisis de Inteligencia Artificial</h3>
                <p className="text-blue-200 text-sm">ID: {selectedComplaint.id.slice(0, 8)}...</p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8 space-y-6">
              
              {/* Sección de Métricas */}
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Gravedad</p>
                  <p className={`text-2xl font-black ${
                    selectedComplaint.aiSeverity === 'HIGH' ? 'text-red-600' : 
                    selectedComplaint.aiSeverity === 'MEDIUM' ? 'text-orange-500' : 'text-green-600'
                  }`}>
                    {selectedComplaint.aiSeverity || 'N/A'}
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Puntaje de Riesgo</p>
                  <p className="text-2xl font-black text-blue-900">
                    {selectedComplaint.aiScore || 0}/100
                  </p>
                </div>
              </div>

              {/* Sanción Sugerida */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-xl">
                <h4 className="font-bold text-yellow-800 mb-1 flex items-center gap-2">
                  ⚖️ Sanción Sugerida
                </h4>
                <p className="text-yellow-900 font-medium text-lg">
                  {selectedComplaint.suggestedSanction || "Sin sugerencia específica"}
                </p>
              </div>

              {/* Razonamiento Detallado */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">📋 Razonamiento Detallado</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border">
                  {/* Aquí intentamos leer el JSON, o mostramos un texto por defecto */}
                  {selectedComplaint.analysisJson?.reasoning || 
                   selectedComplaint.analysisJson?.summary || 
                   selectedComplaint.analysisJson?.explanation ||
                   "No hay detalles adicionales disponibles."}
                </p>
              </div>

              {/* Botón Cerrar inferior */}
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setSelectedComplaint(null)}
                  className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-900 uppercase">RVRS UCE</h1>
          <span className="text-slate-300">|</span>
          <p className="font-medium">Hola, <span className="text-blue-700 font-bold">{user.fullName}</span></p>
        </div>
        <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="text-red-600 font-bold">Cerrar Sesión</button>
      </header>

      <nav className="bg-white border-b px-6 flex gap-6">
        {['home', 'dashboard', 'denuncias'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-2 font-bold capitalize border-b-4 transition-all ${
              activeTab === tab ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400'
            }`}
          >
            {tab === 'denuncias' ? 'Mis Denuncias' : tab}
          </button>
        ))}
      </nav>

      <main className="p-6 max-w-4xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-extrabold mb-8 text-blue-900 border-b pb-2">Nueva Denuncia</h2>
            <form onSubmit={handleSubmitComplaint} className="space-y-6">
              
              {/* CAMPO: TÍTULO */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Título del incidente</label>
                <input 
                  required
                  className="w-full p-4 border rounded-xl bg-slate-50 text-black outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Ej: Acoso verbal en laboratorios"
                  value={complaintData.title}
                  onChange={(e) => setComplaintData({...complaintData, title: e.target.value})}
                />
              </div>

              {/* CAMPO: EDIFICIO */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Facultad / Edificio</label>
                <select 
                  className="w-full p-4 border rounded-xl bg-slate-50 text-black outline-none shadow-sm"
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

              {/* CAMPO: DESCRIPCIÓN */}
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

              {/* CAMPO: EVIDENCIA (CON PREVISUALIZACIÓN) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Evidencia (Obligatorio)</label>
                <div className="flex flex-col gap-4">
                  {/* Si hay archivo, mostramos Preview */}
                  {previewUrl && (
                    <div className="w-full h-64 relative bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-200">
                      {file?.type.startsWith('video') ? (
                        <video src={previewUrl} controls className="max-h-full" />
                      ) : (
                        <img src={previewUrl} alt="Preview" className="max-h-full object-contain" />
                      )}
                      <button 
                        type="button"
                        onClick={() => setFile(null)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 text-xs shadow-lg"
                      >
                        Quitar
                      </button>
                    </div>
                  )}

                  {/* Si NO hay archivo, mostramos input Drag & Drop */}
                  {!file && (
                    <div className="relative border-2 border-dashed border-blue-200 rounded-xl p-8 bg-blue-50 hover:bg-blue-100 transition-all flex flex-col items-center justify-center cursor-pointer">
                      <input 
                        type="file" 
                        required
                        accept="image/*,video/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                      />
                      <span className="text-blue-600 font-bold">➕ Subir Imagen o Video</span>
                      <p className="text-xs text-blue-400 mt-1">Máximo 50MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* BOTÓN ENVIAR */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-800 transition-all shadow-lg active:scale-[0.98] disabled:bg-blue-300"
              >
                {loading ? 'Subiendo datos...' : 'Enviar Denuncia'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'denuncias' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Historial de Denuncias</h2>
            {myComplaints.length === 0 ? (
              <p className="text-slate-500 italic text-center py-10">No has registrado denuncias aún.</p>
            ) : (
              myComplaints.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-center hover:border-blue-200 transition-all gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">{c.title}</h3>
                    <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-600 mt-1 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded text-xs">
                        {c.building.replaceAll('_', ' ')}
                    </p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={`px-4 py-1 rounded-full text-xs font-black tracking-wider ${
                      c.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {c.status}
                    </span>

                    {/* 🔥🔥🔥 3. EL BOTÓN QUE ABRE EL MODAL 🔥🔥🔥 */}
                    {c.aiStatus === 'PROCESSED' ? (
                        <button 
                            onClick={() => setSelectedComplaint(c)}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 shadow-md flex items-center gap-1 transition-transform active:scale-95"
                        >
                            🤖 Ver Análisis
                        </button>
                    ) : (
                        <span className="text-[10px] text-slate-400 font-medium animate-pulse">
                            ⏳ Analizando...
                        </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'home' && (
             /* ... Tu home original ... */
             <div className="py-20 text-center">
                 <h2 className="text-4xl font-black text-blue-900 mb-6 uppercase">Portal RVRS</h2>
                 <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                   Sistema de Reporte de Vulnerabilidades. Tu voz es el primer paso para mejorar nuestra comunidad universitaria.
                 </p>
             </div>
        )}
      </main>
    </div>
  );
}
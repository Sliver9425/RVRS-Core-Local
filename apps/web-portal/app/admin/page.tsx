'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiQuery } from '@/lib/axios';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ fullName: string } | null>(null);
  
  // Datos
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  
  // Búsqueda y Modal
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  // 1. Verificar Sesión de Admin
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      // Validar si es ADMIN (Opcional, pero recomendado)
      // if (parsedUser.role !== 'ADMIN') router.push('/');
      setAdminUser(parsedUser);
      fetchAllComplaints();
    }
  }, [router]);

  // 2. Obtener TODAS las denuncias
  const fetchAllComplaints = async () => {
    try {
      const response = await apiQuery.get('/complaints');
      setAllComplaints(response.data);
      setFilteredComplaints(response.data);
    } catch (error) {
      console.error("Error cargando denuncias:", error);
      alert("No se pudieron cargar las denuncias.");
    }
  };

  // 3. Lógica del Buscador (Filtro en tiempo real)
  useEffect(() => {
    const results = allComplaints.filter(c => 
      c.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredComplaints(results);
  }, [searchTerm, allComplaints]);

  if (!adminUser) return <div className="p-10 text-center">Verificando credenciales...</div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      
      {/* --- MODAL DE DETALLE (POPUP) --- */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Header del Modal */}
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white rounded-t-xl sticky top-0 z-10">
              <h3 className="text-xl font-bold">Detalle de Denuncia</h3>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-white bg-white/10 p-2 rounded-full">✕</button>
            </div>
            
            <div className="p-8 space-y-6">
              
              {/* Información Básica */}
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4 border-b pb-4">
                <div>
                  <p className="font-bold uppercase text-xs">Usuario ID</p>
                  <p className="font-mono text-xs">{selectedComplaint.userId}</p>
                </div>
                <div>
                  <p className="font-bold uppercase text-xs">Fecha</p>
                  <p>{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Título y Descripción */}
              <div>
                <h4 className="text-2xl font-bold text-slate-800 mb-2">{selectedComplaint.title}</h4>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border whitespace-pre-wrap">
                    {selectedComplaint.description}
                </p>
              </div>

              {/* 🔥🔥🔥 SECCIÓN DE EVIDENCIA (FOTO/VIDEO) 🔥🔥🔥 */}
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h5 className="font-bold text-slate-700 flex items-center gap-2">
                        📂 Evidencia Adjunta
                    </h5>
                    {selectedComplaint.evidenceUrl && (
                        <a 
                          href={selectedComplaint.evidenceUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline font-bold bg-white px-2 py-1 rounded border"
                        >
                          Abrir original ↗
                        </a>
                    )}
                </div>

                {selectedComplaint.evidenceUrl ? (
                  <div className="rounded-lg overflow-hidden shadow-sm bg-black flex justify-center items-center min-h-[200px]">
                    {selectedComplaint.evidenceType === 'VIDEO' ? (
                      <video 
                        src={selectedComplaint.evidenceUrl} 
                        controls 
                        className="max-h-[400px] w-full" 
                      />
                    ) : (
                      <img 
                        src={selectedComplaint.evidenceUrl} 
                        alt="Evidencia" 
                        className="max-h-[400px] w-auto object-contain" 
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm text-center py-4">No hay evidencia visual disponible.</p>
                )}
              </div>

              {/* Sección IA */}
              {selectedComplaint.aiStatus === 'PROCESSED' ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2 border-b border-blue-200 pb-2">
                    <span className="text-2xl">🤖</span>
                    <h5 className="font-bold text-blue-900">Análisis Inteligente</h5>
                  </div>
                  
                  {/* Métricas */}
                  <div className="flex gap-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm flex-1 text-center border border-blue-100">
                         <span className="block text-xs font-bold text-slate-400">GRAVEDAD</span>
                         <span className={`font-black text-xl ${
                             selectedComplaint.aiSeverity === 'HIGH' ? 'text-red-600' : 
                             selectedComplaint.aiSeverity === 'MEDIUM' ? 'text-orange-500' : 'text-green-600'
                         }`}>{selectedComplaint.aiSeverity}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm flex-1 text-center border border-blue-100">
                         <span className="block text-xs font-bold text-slate-400">PUNTAJE</span>
                         <span className="font-black text-xl text-blue-900">{selectedComplaint.aiScore}/100</span>
                      </div>
                  </div>

                  {/* Sanción */}
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <span className="font-bold text-blue-800 text-sm block mb-1">⚖️ Sanción Sugerida:</span>
                    <p className="text-slate-700 font-medium">{selectedComplaint.suggestedSanction}</p>
                  </div>
                  
                  {/* JSON Expandible */}
                  <details className="text-xs text-slate-500 cursor-pointer">
                    <summary className="hover:text-blue-600 font-medium">Ver detalles técnicos (JSON)</summary>
                    <pre className="mt-2 bg-slate-900 text-green-400 p-3 rounded-lg overflow-x-auto border border-slate-700 shadow-inner">
                      {JSON.stringify(selectedComplaint.analysisJson, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl text-gray-500 italic border border-dashed border-gray-300">
                  ⏳ Esperando análisis de Inteligencia Artificial...
                </div>
              )}

              {/* Botón Cerrar */}
              <div className="flex justify-end pt-4 border-t">
                 <button 
                    onClick={() => setSelectedComplaint(null)} 
                    className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition-colors"
                 >
                    Cerrar
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER SUPERIOR --- */}
      <header className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded tracking-widest">ADMIN</div>
          <h1 className="text-xl font-bold tracking-wider">PANEL DE CONTROL</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-slate-400 text-sm hidden md:inline">
            Admin: <span className="text-white font-medium">{adminUser.fullName}</span>
          </span>
          <button 
            onClick={() => { localStorage.clear(); router.push('/login'); }} 
            className="text-red-400 hover:text-white hover:bg-red-600 text-sm font-bold border border-red-900 bg-red-900/20 px-4 py-2 rounded-lg transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="max-w-6xl mx-auto p-8">
        
        {/* Barra de Búsqueda */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800">Denuncias Recibidas</h2>
            <p className="text-slate-500 mt-1">Monitoreo y gestión de incidentes en tiempo real.</p>
          </div>
          
          <div className="w-full md:w-96 relative group">
            <input 
              type="text" 
              placeholder="Buscar por ID, Estado, Título..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 outline-none transition-all shadow-sm group-hover:shadow-md bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-4 top-3.5 text-slate-400 text-lg group-focus-within:text-blue-600 transition-colors">🔍</span>
          </div>
        </div>

        {/* Lista de Tarjetas */}
        <div className="grid gap-4">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-slate-300">
               <p className="text-4xl mb-4">📭</p>
               <p className="text-xl text-slate-400 font-medium">No se encontraron resultados.</p>
            </div>
          ) : (
            filteredComplaints.map((c) => (
              <div key={c.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6 group">
                
                {/* Icono Tipo Evidencia */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 ${
                   c.aiSeverity === 'HIGH' ? 'bg-red-100 text-red-600' : 
                   c.aiSeverity === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {c.evidenceType === 'VIDEO' ? '🎥' : '📷'}
                </div>

                {/* Info Principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      c.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 truncate">{c.title}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1 truncate bg-slate-50 inline-block px-1 rounded">ID: {c.userId}</p>
                </div>

                {/* Métricas Rápidas (Solo si procesado) */}
                {c.aiStatus === 'PROCESSED' && (
                   <div className="flex gap-4 px-4 border-l border-r border-slate-100 text-center min-w-[100px] justify-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Riesgo</p>
                        <p className={`font-black text-lg ${
                            c.aiSeverity === 'HIGH' ? 'text-red-600' : 'text-slate-700'
                        }`}>{c.aiScore}</p>
                      </div>
                   </div>
                )}

                {/* Botón Revisar */}
                <button 
                  onClick={() => setSelectedComplaint(c)}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-slate-200 active:scale-95 whitespace-nowrap"
                >
                  Revisar Denuncia
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Briefcase, MapPin, CreditCard,
  Calendar, Euro, ClipboardSignature, Edit3, HardHat,
  Clock, Users, Tag, Banknote, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import AddWorkerModal from '@/components/forms/AddWorkerModal';
import EditWorkerModal from '@/components/forms/EditWorkerModal';
import { exportWorkerToExcel } from '@/utils/exportWorkerExcel';
import { formatCurrency } from '@/utils/utils';

// Determina si un trabajador está activo: la fecha de alta debe ser anterior o
// igual a hoy y la fecha de baja debe ser nula o futura.
export function isActivo(trabajador) {
  const today = new Date();
  const fechaAlta = new Date(trabajador.fecha_alta);
  const fechaBaja = trabajador.fecha_baja ? new Date(trabajador.fecha_baja) : null;
  return fechaAlta <= today && (!fechaBaja || fechaBaja >= today);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

const filterOptions = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'pais', label: 'País' },
  { value: 'dni', label: 'DNI' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'correo_electronico', label: 'Correo' }
];

export default function Trabajador() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('nombre');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const workersPerPage = 6; // o el número que prefieras

  const filteredTrabajadores = trabajadores
    .filter((t) => {
      const valor = (t[filterBy] || '').toString().toLowerCase();
      return valor.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const valorA = (a[filterBy] || '').toString().toLowerCase();
      const valorB = (b[filterBy] || '').toString().toLowerCase();
      if (valorA < valorB) return -1;
      if (valorA > valorB) return 1;
      return 0;
    });

  const paginatedTrabajadores = filteredTrabajadores.slice(
    (currentPage - 1) * workersPerPage,
    currentPage * workersPerPage
  );

  const indexOfLastWorker = currentPage * workersPerPage;
  const indexOfFirstWorker = indexOfLastWorker - workersPerPage;
  const currentTrabajadores = filteredTrabajadores.slice(indexOfFirstWorker, indexOfLastWorker);





  const navigate = useNavigate();

// 1. Función reutilizable para cargar trabajadores
const fetchWorkers = () => {
  const token = localStorage.getItem('token');
  axios.get(`${import.meta.env.VITE_API_URL}/trabajadores`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((res) => setTrabajadores(res.data))
    .catch((err) => {
      console.error(err);
      setError('No se pudo cargar la lista de trabajadores');
    });
};

// 2. Llamada inicial en useEffect
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return navigate('/');
  fetchWorkers(); // ⬅️ Se llama aquí
}, [navigate]);

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, filterBy]);


// 3. Dar de alta usando fetchWorkers
const handleAlta = async (id) => {
  const token = localStorage.getItem('token');
  if (!window.confirm('¿Deseas volver a dar de alta a este trabajador?')) return;

  try {
    await axios.put(`${import.meta.env.VITE_API_URL}/trabajadores/${id}`, {
      fecha_baja: null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchWorkers(); // ⬅️ Se recarga
  } catch (err) {
    console.error('Error al dar de alta:', err);
    alert('No se pudo dar de alta al trabajador.');
  }
};

// 4. Dar de baja usando fetchWorkers
const handleBaja = async (id) => {
  const token = localStorage.getItem('token');
  if (!window.confirm('¿Deseas dar de baja a este trabajador?')) return;

  try {
    const fechaHoy = new Date().toISOString().split('T')[0];
    await axios.put(`${import.meta.env.VITE_API_URL}/trabajadores/${id}`, {
      fecha_baja: fechaHoy
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchWorkers(); // ⬅️ Se recarga
  } catch (err) {
    console.error('Error al dar de baja:', err);
    alert('No se pudo dar de baja al trabajador.');
  }
};

// 5. Lógica para editar trabajador (cuando implementes modal)
  const handleEdit = (trabajador) => {
    setTrabajadorSeleccionado(trabajador);
    setShowEditModal(true);
  };

  const handleDescargarPlantilla = (trabajador) => {
    // Exporta los datos del trabajador como plantilla de Excel
    try {
      exportWorkerToExcel(trabajador);
    } catch (err) {
      console.error('Error al generar Excel:', err);
      alert('No se pudo generar el archivo');
    }
  };






  return (
    <>
    <Header />
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder={`Buscar por ${filterOptions.find(o => o.value === filterBy)?.label.toLowerCase()}...`}
            className="w-full md:w-64 p-3 text-black text-base border border-gray-300 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="w-full md:w-48 p-3 text-black text-base border border-gray-300 rounded"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Añadir Trabajador
        </button>

      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {currentTrabajadores.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl p-6 space-y-3 text-sm shadow transition-all duration-300 ${
              isActivo(t) ? 'bg-white border border-gray-200' : 'bg-red-50 border border-red-400'
            }`}
          >
            <div className="flex flex-col mb-2 space-y-1">
              <div className="flex items-center text-blue-600 text-lg font-semibold">
                <User className="w-5 h-5 mr-2" />
                {t.nombre}
                {t.pais && (
                  <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {t.pais}
                  </span>
                )}
                <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                  isActivo(t) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isActivo(t) ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {t.empresa && (
                <div className="text-sm font-medium text-gray-500 italic ml-7">
                  Empresa: {t.empresa}
                </div>
              )}
            </div>
      
            <div className="space-y-1 text-gray-800">
              <p><MapPin className="inline w-4 h-4 mr-1 text-orange-500" /> {t.direccion}</p>
              <p><CreditCard className="inline w-4 h-4 mr-1 text-purple-600" /> DNI: {t.dni}</p>
              <p><Phone className="inline w-4 h-4 mr-1 text-green-500" /> {t.telefono}</p>
              <p><Mail className="inline w-4 h-4 mr-1 text-pink-500" /> {t.correo_electronico}</p>
              {t.iban && (<p><Banknote className="inline w-4 h-4 mr-1 text-green-600" />IBAN: {t.iban}</p>)}
              {t.nss && (<p><Shield className="inline w-4 h-4 mr-1 text-gray-700" />NSS: {t.nss}</p>)}
              <p><Briefcase className="inline w-4 h-4 mr-1 text-indigo-500" /> Tipo: {t.tipo_trabajador}</p>
              <AnimatePresence>
                {expandedId === t.id && (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden space-y-1"
                  >
                    {t.grupo && (<p><Users className="inline w-4 h-4 mr-1 text-blue-500" />Grupo: {t.grupo}</p>)}
                    {t.categoria && (<p><Tag className="inline w-4 h-4 mr-1 text-indigo-500" />Categoría: {t.categoria}</p>)}
                    <p><Calendar className="inline w-4 h-4 mr-1 text-blue-500" /> Alta: {formatDate(t.fecha_alta)}</p>
                    {t.fecha_baja && (<p><Calendar className="inline w-4 h-4 mr-1 text-red-500" /> Baja: {formatDate(t.fecha_baja)}</p>)}
                    <p><Clock className="inline w-4 h-4 mr-1 text-gray-700" /> Horas: {t.horas_contratadas}</p>
                    <p><Euro className="inline w-4 h-4 mr-1 text-emerald-500" /> Salario Neto: {formatCurrency(t.salario_neto)} €</p>
                    <p><Euro className="inline w-4 h-4 mr-1 text-emerald-300" /> Salario Bruto: {formatCurrency(t.salario_bruto)} €</p>
                    <p><User className="inline w-4 h-4 mr-1 text-red-500" /> Cliente: {t.cliente}</p>
                    <p>A1: {t.a1 ? 'Sí' : 'No'}</p>
                    <p>Fecha Limosa: {t.fecha_limosa ? formatDate(t.fecha_limosa) : 'N/A'}</p>
                    <p>Fin Limosa: {t.fechafin_limosa ? formatDate(t.fechafin_limosa) : 'N/A'}</p>
                    <p>Fecha A1: {t.fecha_a1 ? formatDate(t.fecha_a1) : 'N/A'}</p>
                    <p>Fin A1: {t.fechafin_a1 ? formatDate(t.fechafin_a1) : 'N/A'}</p>
                    <p>Desplazamiento: {t.desplazamiento ? 'Sí' : 'No'}</p>
                    <p>Fecha Desplazamiento: {t.fecha_desplazamiento ? formatDate(t.fecha_desplazamiento) : 'N/A'}</p>
                    <p><HardHat className="inline w-4 h-4 mr-1 text-yellow-600" /> EPIs: {t.epis ? 'Sí' : 'No'}</p>
                    {t.epis && <p>Fecha EPIs: {t.fecha_epis ? formatDate(t.fecha_epis) : 'N/A'}</p>}
                    <p className="italic text-gray-600">
                      <ClipboardSignature className="inline w-4 h-4 mr-1" /> {t.condiciones}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                {expandedId === t.id ? 'Ver menos' : 'Ver más'}
              </button>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => handleEdit(t)}
                className="flex items-center px-3 py-1 border border-blue-500 text-blue-600 text-sm rounded hover:bg-blue-50"
              >
                <Edit3 className="w-4 h-4 mr-1" /> Editar
              </button>
              {isActivo(t) ? (
                t.fecha_baja ? (
                  <button
                    onClick={() => handleAlta(t.id)}
                    className="flex items-center px-3 py-1 border border-green-600 text-green-700 text-sm rounded hover:bg-green-50"
                  >
                    <Calendar className="w-4 h-4 mr-1" /> Cancelar baja
                  </button>
                ) : (
                <button
                  onClick={() => handleBaja(t.id)}
                  className="flex items-center px-3 py-1 border border-yellow-500 text-yellow-700 text-sm rounded hover:bg-yellow-50"
                >
                  <Calendar className="w-4 h-4 mr-1" /> Dar de baja
                </button>
              )
            ) : (
              <button
                onClick={() => handleAlta(t.id)}
                className="flex items-center px-3 py-1 border border-green-600 text-green-700 text-sm rounded hover:bg-green-50"
              >
                <Calendar className="w-4 h-4 mr-1" /> Dar de alta
              </button>
            )}
            <button
              onClick={() => handleDescargarPlantilla(t)}
              className="flex items-center px-3 py-1 border border-gray-500 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              Descargar Plantilla
            </button>
          </div>
            
          </div>
        )
        )
        }
        <AddWorkerModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onWorkerAdded={fetchWorkers} // crea esta función si no existe para recargar lista
            />
        <EditWorkerModal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            onWorkerUpdated={fetchWorkers}
            initialData={trabajadorSeleccionado}
          />


      </div>
<div className="mt-8 flex justify-center items-center gap-2">
  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(prev => prev - 1)}
    className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Anterior
  </button>

  <span className="text-black font-medium">{currentPage}</span>

  <button
    disabled={indexOfLastWorker >= filteredTrabajadores.length}
    onClick={() => setCurrentPage(prev => prev + 1)}
    className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Siguiente
  </button>
</div>


    </div>
    
    </>
  );
}

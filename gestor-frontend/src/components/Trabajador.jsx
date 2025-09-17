import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Briefcase, MapPin, CreditCard,
  Calendar, Euro, ClipboardSignature, Edit3, HardHat,
  Clock, Users, Tag, Banknote, Shield
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import AddWorkerModal from '@/components/forms/AddWorkerModal';
import EditWorkerModal from '@/components/forms/EditWorkerModal';
import { exportWorkerToExcel, exportWorkersSelectionToExcel } from '@/utils/exportWorkerExcel';
import { formatCurrency } from '@/utils/utils';

// Determina si un trabajador está activo: la fecha de alta debe ser anterior o
// igual a hoy y la fecha de baja debe ser nula o futura.
// eslint-disable-next-line react-refresh/only-export-components
export function isActivo(trabajador) {
  const today = new Date();
  const fechaAlta = new Date(trabajador.fecha_alta);
  const fechaBaja = trabajador.fecha_baja ? new Date(trabajador.fecha_baja) : null;
  return fechaAlta <= today && (!fechaBaja || fechaBaja >= today);
}

// eslint-disable-next-line react-refresh/only-export-components
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

const exportableFields = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'dni', label: 'DNI' },
  { key: 'correo_electronico', label: 'Correo electrónico' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'pais', label: 'País' },
  { key: 'tipo_trabajador', label: 'Tipo de trabajador' },
  { key: 'grupo', label: 'Grupo' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'iban', label: 'IBAN' },
  { key: 'nss', label: 'NSS' },
  { key: 'fecha_alta', label: 'Fecha de alta' },
  { key: 'fecha_baja', label: 'Fecha de baja' },
  { key: 'horas_contratadas', label: 'Horas contratadas' },
  { key: 'salario_neto', label: 'Salario neto' },
  { key: 'salario_bruto', label: 'Salario bruto' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'a1', label: 'A1' },
  { key: 'fecha_a1', label: 'Fecha A1' },
  { key: 'fechafin_a1', label: 'Fin A1' },
  { key: 'limosa', label: 'Limosa' },
  { key: 'fecha_limosa', label: 'Fecha Limosa' },
  { key: 'fechafin_limosa', label: 'Fin Limosa' },
  { key: 'desplazamiento', label: 'Desplazamiento' },
  { key: 'fecha_desplazamiento', label: 'Fecha desplazamiento' },
  { key: 'epis', label: 'EPIs' },
  { key: 'fecha_epis', label: 'Fecha EPIs' },
  { key: 'condiciones', label: 'Condiciones' }
];

const exportFieldOrder = exportableFields.map(field => field.key);
const exportFieldLabels = exportableFields.reduce((acc, field) => {
  acc[field.key] = field.label;
  return acc;
}, {});

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
  const [selectedFields, setSelectedFields] = useState(['nombre', 'dni', 'epis']);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const workersPerPage = 9; // mostrar 9 trabajadores por página

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

  const indexOfLastWorker = currentPage * workersPerPage;
  const indexOfFirstWorker = indexOfLastWorker - workersPerPage;
  const currentTrabajadores = filteredTrabajadores.slice(indexOfFirstWorker, indexOfLastWorker);
  const totalPages = Math.ceil(filteredTrabajadores.length / workersPerPage);

  const toggleFieldSelection = (fieldKey) => {
    setSelectedFields((prev) => {
      if (prev.includes(fieldKey)) {
        return prev.filter((field) => field !== fieldKey);
      }

      const updated = [...prev, fieldKey];
      return exportFieldOrder.filter((key) => updated.includes(key));
    });
  };

  const handleSelectAllFields = () => {
    setSelectedFields((prev) => (prev.length === exportFieldOrder.length ? [] : [...exportFieldOrder]));
  };

  const handleClearSelectedFields = () => {
    setSelectedFields([]);
  };

  const handleExportSelectedFields = () => {
    if (selectedFields.length === 0) {
      alert('Selecciona al menos un campo para exportar.');
      return;
    }

    if (filteredTrabajadores.length === 0) {
      alert('No hay trabajadores que coincidan con la búsqueda actual.');
      return;
    }

    try {
      exportWorkersSelectionToExcel(filteredTrabajadores, selectedFields, {
        fieldLabels: exportFieldLabels
      });
    } catch (err) {
      console.error('Error al exportar trabajadores:', err);
      alert('No se pudo generar el archivo de Excel.');
    }
  };

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
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
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
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full md:w-auto"
        >
          Añadir Trabajador
        </button>

      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Exportar trabajadores</h2>
            <p className="text-sm text-gray-500">Elige los campos que quieres incluir en el Excel.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowFieldSelector((prev) => !prev)}
              className="px-3 py-2 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition"
            >
              {showFieldSelector ? 'Ocultar campos' : 'Seleccionar campos'}
            </button>
            <button
              type="button"
              onClick={handleExportSelectedFields}
              disabled={selectedFields.length === 0 || filteredTrabajadores.length === 0}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Exportar Excel
            </button>
          </div>
        </div>

        {showFieldSelector && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSelectAllFields}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition"
              >
                {selectedFields.length === exportFieldOrder.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
              <button
                type="button"
                onClick={handleClearSelectedFields}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition"
              >
                Limpiar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {exportableFields.map((field) => (
                <label
                  key={field.key}
                  className={`flex items-center gap-2 rounded border px-3 py-2 text-sm transition ${
                    selectedFields.includes(field.key)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedFields.includes(field.key)}
                    onChange={() => toggleFieldSelection(field.key)}
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {!showFieldSelector && selectedFields.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedFields.map((key) => (
              <span key={key} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {exportFieldLabels[key]}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500">
          {filteredTrabajadores.length === 0
            ? 'No hay trabajadores que coincidan con la búsqueda actual.'
            : selectedFields.length === 0
              ? 'Selecciona al menos un campo para habilitar la exportación.'
              : `Se exportarán ${filteredTrabajadores.length} trabajador${filteredTrabajadores.length === 1 ? '' : 'es'} con ${selectedFields.length} campo${selectedFields.length === 1 ? '' : 's'} seleccionados.`}
        </p>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {currentTrabajadores.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl p-4 sm:p-6 space-y-3 text-sm shadow transition-all duration-300 ${
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
                    {t.a1 && (
                      <>
                        <p>Fecha A1: {t.fecha_a1 ? formatDate(t.fecha_a1) : 'N/A'}</p>
                        <p>Fin A1: {t.fechafin_a1 ? formatDate(t.fechafin_a1) : 'N/A'}</p>
                        <p>Limosa: {t.limosa ? 'Sí' : 'No'}</p>
                        {t.limosa && (
                          <>
                            <p>Fecha Limosa: {t.fecha_limosa ? formatDate(t.fecha_limosa) : 'N/A'}</p>
                            <p>Fin Limosa: {t.fechafin_limosa ? formatDate(t.fechafin_limosa) : 'N/A'}</p>
                          </>
                        )}
                      </>
                    )}
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
<div className="mt-8 flex flex-col items-center gap-2">
  <div className="flex items-center gap-2">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(prev => prev - 1)}
      className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Anterior
    </button>

    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i + 1}
        onClick={() => setCurrentPage(i + 1)}
        className={`px-3 py-1 rounded border ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 hover:bg-gray-100 border-gray-300'}`}
      >
        {i + 1}
      </button>
    ))}

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(prev => prev + 1)}
      className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Siguiente
    </button>
  </div>
  <span className="text-black font-medium">Página {currentPage} de {totalPages}</span>
</div>


    </div>
    
    </>
  );
}

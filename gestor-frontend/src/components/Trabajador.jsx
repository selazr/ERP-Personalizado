import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  CreditCard,
  Calendar,
  Euro,
  ClipboardSignature,
  Edit3,
  HardHat,
  Clock,
  Users,
  Tag,
  Banknote,
  Shield,
  Search,
  Filter,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import AddWorkerModal from '@/components/forms/AddWorkerModal';
import EditWorkerModal from '@/components/forms/EditWorkerModal';
import { exportWorkerToExcel, exportWorkersSelectionToExcel } from '@/utils/exportWorkerExcel';
import { formatCurrency } from '@/utils/utils';
import { apiUrl } from '@/utils/api';

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
  const workersPerPage = 9;

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
  const totalPages = Math.ceil(filteredTrabajadores.length / workersPerPage) || 1;

  const totalTrabajadores = filteredTrabajadores.length;
  const activosCount = filteredTrabajadores.filter(isActivo).length;
  const inactivosCount = totalTrabajadores - activosCount;

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

  const fetchWorkers = () => {
    const token = localStorage.getItem('token');
    axios.get(apiUrl('trabajadores'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setTrabajadores(res.data))
      .catch((err) => {
        console.error(err);
        setError('No se pudo cargar la lista de trabajadores');
      });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');
    fetchWorkers();
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBy]);

  const handleAlta = async (id) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('¿Deseas volver a dar de alta a este trabajador?')) return;

    try {
      await axios.put(apiUrl(`trabajadores/${id}`), {
        fecha_baja: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchWorkers();
    } catch (err) {
      console.error('Error al dar de alta:', err);
      alert('No se pudo dar de alta al trabajador.');
    }
  };

  const handleBaja = async (id) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('¿Deseas dar de baja a este trabajador?')) return;

    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      await axios.put(apiUrl(`trabajadores/${id}`), {
        fecha_baja: fechaHoy
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchWorkers();
    } catch (err) {
      console.error('Error al dar de baja:', err);
      alert('No se pudo dar de baja al trabajador.');
    }
  };

  const handleEdit = (trabajador) => {
    setTrabajadorSeleccionado(trabajador);
    setShowEditModal(true);
  };

  const handleDescargarPlantilla = (trabajador) => {
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
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6">
            <h1 className="text-xl font-semibold text-slate-900 mb-4">Gestionar trabajadores</h1>
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="searchInput">
                  Buscar trabajador
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="searchInput"
                    type="text"
                    placeholder={`Buscar por ${filterOptions.find(o => o.value === filterBy)?.label.toLowerCase()}...`}
                    className="w-full pl-10 pr-4 py-3 text-base text-slate-900 placeholder:text-slate-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full lg:w-56">
                <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="filterSelect">
                  Filtrar por
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    id="filterSelect"
                    className="w-full appearance-none pl-10 pr-8 py-3 text-base text-slate-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                  >
                    {filterOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition"
              >
                <User className="h-5 w-5" /> Añadir trabajador
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{totalTrabajadores}</p>
                <p className="text-xs text-slate-500">Trabajadores filtrados</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-600">Activos</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-700">{activosCount}</p>
                <p className="text-xs text-emerald-600">Con alta vigente</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs uppercase tracking-wide text-amber-600">Inactivos</p>
                <p className="mt-2 text-2xl font-semibold text-amber-700">{inactivosCount}</p>
                <p className="text-xs text-amber-600">Con baja registrada</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Exportar trabajadores</h2>
                <p className="text-sm text-slate-500">Selecciona los campos necesarios y descarga un Excel personalizado.</p>
              </div>
              <Banknote className="h-10 w-10 text-blue-500 hidden sm:block" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowFieldSelector((prev) => !prev)}
                className="px-3 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                {showFieldSelector ? 'Ocultar campos' : 'Seleccionar campos'}
              </button>
              <button
                type="button"
                onClick={handleExportSelectedFields}
                disabled={selectedFields.length === 0 || filteredTrabajadores.length === 0}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Exportar Excel
              </button>
            </div>

            {showFieldSelector && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFields}
                    className="px-3 py-1 text-sm text-black border border-gray-300 rounded hover:bg-gray-100 transition"
                  >
                    {selectedFields.length === exportFieldOrder.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelectedFields}
                    className="px-3 py-1 text-sm text-black border border-gray-300 rounded hover:bg-gray-100 transition"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {exportableFields.map((field) => (
                    <label
                      key={field.key}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
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

            <p className="mt-3 text-xs text-slate-500">
              {filteredTrabajadores.length === 0
                ? 'No hay trabajadores que coincidan con la búsqueda actual.'
                : selectedFields.length === 0
                  ? 'Selecciona al menos un campo para habilitar la exportación.'
                  : `Se exportarán ${filteredTrabajadores.length} trabajador${filteredTrabajadores.length === 1 ? '' : 'es'} con ${selectedFields.length} campo${selectedFields.length === 1 ? '' : 's'} seleccionados.`}
            </p>
          </div>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        {currentTrabajadores.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700">No se encontraron trabajadores</p>
            <p className="text-sm text-gray-500">Ajusta los filtros o añade un nuevo registro para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {currentTrabajadores.map((t) => (
              <div
                key={t.id}
                className={`rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                  isActivo(t) ? 'bg-white border-gray-200' : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex flex-col gap-4 p-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-800">
                      <User className="w-5 h-5 text-blue-600" />
                      <span className="flex-1 min-w-0 truncate" title={t.nombre}>{t.nombre}</span>
                      {t.pais && (
                        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {t.pais}
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isActivo(t) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isActivo(t) ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-500">
                      {t.empresa && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                          <Briefcase className="w-3 h-3" /> {t.empresa}
                        </span>
                      )}
                      {t.tipo_trabajador && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">
                          <Shield className="w-3 h-3" /> {t.tipo_trabajador}
                        </span>
                      )}
                      {t.grupo && (
                        <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-purple-600">
                          <Users className="w-3 h-3" /> {t.grupo}
                        </span>
                      )}
                      {t.categoria && (
                        <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-indigo-600">
                          <Tag className="w-3 h-3" /> {t.categoria}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4 space-y-2 text-sm text-slate-700">
                    <div className="grid grid-cols-1 gap-2">
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-500" />
                        <span className="truncate" title={t.correo_electronico}>{t.correo_electronico || 'Sin correo'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-500" />
                        <span>{t.telefono || 'Sin teléfono'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span className="truncate" title={t.direccion}>{t.direccion || 'Sin dirección'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-500" />
                        <span>{t.iban || 'Sin IBAN'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p><Calendar className="inline w-4 h-4 mr-1 text-blue-500" /> Alta: {formatDate(t.fecha_alta)}</p>
                      {t.fecha_baja && (
                        <p><Calendar className="inline w-4 h-4 mr-1 text-rose-500" /> Baja: {formatDate(t.fecha_baja)}</p>
                      )}
                    </div>
                    <p><Clock className="inline w-4 h-4 mr-1 text-slate-600" /> Horas contratadas: {t.horas_contratadas || 'N/A'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p><Euro className="inline w-4 h-4 mr-1 text-emerald-600" /> Neto: {formatCurrency(t.salario_neto)} €</p>
                      <p><Euro className="inline w-4 h-4 mr-1 text-emerald-400" /> Bruto: {formatCurrency(t.salario_bruto)} €</p>
                    </div>
                    {t.cliente && (
                      <p><User className="inline w-4 h-4 mr-1 text-indigo-500" /> Cliente: {t.cliente}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p>A1: {t.a1 ? 'Sí' : 'No'}</p>
                      <p>Desplazamiento: {t.desplazamiento ? 'Sí' : 'No'}</p>
                      {t.a1 && (
                        <p>Fecha A1: {t.fecha_a1 ? formatDate(t.fecha_a1) : 'N/A'}</p>
                      )}
                      {t.a1 && (
                        <p>Fin A1: {t.fechafin_a1 ? formatDate(t.fechafin_a1) : 'N/A'}</p>
                      )}
                      {t.limosa && (
                        <p>Fecha Limosa: {t.fecha_limosa ? formatDate(t.fecha_limosa) : 'N/A'}</p>
                      )}
                      {t.limosa && (
                        <p>Fin Limosa: {t.fechafin_limosa ? formatDate(t.fechafin_limosa) : 'N/A'}</p>
                      )}
                      {t.desplazamiento && (
                        <p>Fecha desplazamiento: {t.fecha_desplazamiento ? formatDate(t.fecha_desplazamiento) : 'N/A'}</p>
                      )}
                      {t.epis && (
                        <p>Fecha EPIs: {t.fecha_epis ? formatDate(t.fecha_epis) : 'N/A'}</p>
                      )}
                    </div>
                    {t.condiciones && (
                      <p className="italic text-gray-600">
                        <ClipboardSignature className="inline w-4 h-4 mr-1" /> {t.condiciones}
                      </p>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedId === t.id && (
                      <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden space-y-2 text-sm text-slate-700"
                      >
                        <p><HardHat className="inline w-4 h-4 mr-1 text-yellow-600" /> EPIs entregados: {t.epis ? 'Sí' : 'No'}</p>
                        {t.nss && <p><Shield className="inline w-4 h-4 mr-1 text-slate-500" /> NSS: {t.nss}</p>}
                        {t.epis && <p>Fecha EPIs: {t.fecha_epis ? formatDate(t.fecha_epis) : 'N/A'}</p>}
                        <p className="flex items-center gap-2">
                          <ClipboardSignature className="w-4 h-4 text-slate-500" />
                          <span>{t.condiciones || 'Sin condiciones específicas'}</span>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {expandedId === t.id ? 'Ver menos detalles' : 'Ver más detalles'}
                  </button>

                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="flex items-center gap-1 px-3 py-2 border border-blue-500 text-blue-600 text-sm rounded-lg hover:bg-blue-50"
                    >
                      <Edit3 className="w-4 h-4" /> Editar
                    </button>
                    {isActivo(t) ? (
                      t.fecha_baja ? (
                        <button
                          onClick={() => handleAlta(t.id)}
                          className="flex items-center gap-1 px-3 py-2 border border-green-600 text-green-700 text-sm rounded-lg hover:bg-green-50"
                        >
                          <Calendar className="w-4 h-4" /> Cancelar baja
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBaja(t.id)}
                          className="flex items-center gap-1 px-3 py-2 border border-amber-500 text-amber-600 text-sm rounded-lg hover:bg-amber-50"
                        >
                          <Calendar className="w-4 h-4" /> Dar de baja
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleAlta(t.id)}
                        className="flex items-center gap-1 px-3 py-2 border border-green-600 text-green-700 text-sm rounded-lg hover:bg-green-50"
                      >
                        <Calendar className="w-4 h-4" /> Dar de alta
                      </button>
                    )}
                    <button
                      onClick={() => handleDescargarPlantilla(t)}
                      className="flex items-center gap-1 px-3 py-2 border border-slate-400 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
                    >
                      Descargar plantilla
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AddWorkerModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onWorkerAdded={fetchWorkers}
        />
        <EditWorkerModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onWorkerUpdated={fetchWorkers}
          initialData={trabajadorSeleccionado}
        />

        {totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-800 hover:bg-slate-100 border-slate-300'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <span className="text-sm font-medium text-slate-600">Página {currentPage} de {totalPages}</span>
          </div>
        )}
      </div>
    </>
  );
}

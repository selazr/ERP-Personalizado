// src/components/forms/EditWorkerModal.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { X } from 'lucide-react';
import { parseCurrency, formatCurrency } from '@/utils/utils';
import { apiUrl } from '@/utils/api';
import apiClient from '@/utils/apiClient';
import { useEmpresa } from '@/context/EmpresaContext';

export default function EditWorkerModal({ open, onClose, onWorkerUpdated, initialData }) {
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const { empresas } = useEmpresa();

  const empresaOptions = useMemo(() => {
    const names = empresas.map((empresa) => empresa.nombre).filter(Boolean);
    if (form.empresa && !names.includes(form.empresa)) {
      names.unshift(form.empresa);
    }
    return Array.from(new Set(names));
  }, [empresas, form.empresa]);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        salario_neto: formatCurrency(initialData.salario_neto),
        salario_bruto: formatCurrency(initialData.salario_bruto)
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (["salario_neto", "salario_bruto"].includes(name)) {
      const formatted = value.replace(/[^0-9.,]/g, "");
      setForm((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (["salario_neto", "salario_bruto"].includes(name) && value) {
      const parsed = parseCurrency(value);
      if (parsed !== null) {
        setForm((prev) => ({ ...prev, [name]: formatCurrency(parsed) }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.nombre) errors.nombre = 'El nombre es obligatorio';
    if (!form.dni) errors.dni = 'El DNI es obligatorio';
    if (!form.correo_electronico) errors.correo_electronico = 'El correo electrónico es obligatorio';
    if (!form.tipo_trabajador) errors.tipo_trabajador = 'El tipo de trabajador es obligatorio';
    if (!form.fecha_alta) errors.fecha_alta = 'La fecha de alta es obligatoria';
    if (!form.horas_contratadas) errors.horas_contratadas = 'Las horas contratadas son obligatorias';
    if (!form.salario_neto) errors.salario_neto = 'El salario neto mensual es obligatorio';
    if (!form.salario_bruto) errors.salario_bruto = 'El salario bruto mensual es obligatorio';
    if (form.limosa && !form.fecha_limosa) errors.fecha_limosa = 'Debe especificar la fecha Limosa';
    if (form.limosa && !form.fechafin_limosa) errors.fechafin_limosa = 'Debe especificar la fecha fin Limosa';
    if (form.a1 && !form.fecha_a1) errors.fecha_a1 = 'Debe especificar la fecha A1';
    if (form.a1 && !form.fechafin_a1) errors.fechafin_a1 = 'Debe especificar la fecha fin A1';
    if (form.epis && !form.fecha_epis) errors.fecha_epis = 'Debe especificar la fecha de EPIs';
    if (form.desplazamiento && !form.fecha_desplazamiento) errors.fecha_desplazamiento = 'Debe especificar la fecha de desplazamiento';
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const ignoredKeys = new Set(['id', 'empresa_id', 'createdAt', 'updatedAt']);
      const parsedForm = Object.fromEntries(
        Object.entries(form)
          .filter(([key]) => !ignoredKeys.has(key))
          .map(([key, value]) => {
          if (value === '') return [key, null];
          if (["a1", "limosa", "epis", "desplazamiento"].includes(key)) return [key, Boolean(value)];
          if (["salario_neto", "salario_bruto"].includes(key)) return [key, parseCurrency(value)];
          return [key, value];
          })
      );

      await apiClient.put(apiUrl(`trabajadores/${form.id}`), parsedForm);

      onWorkerUpdated();
      onClose();
    } catch (error) {
      console.error(error);
      const errorMessage = error?.response?.data?.error
        || error?.response?.data?.message
        || error?.message
        || 'Error al actualizar trabajador';
      alert(errorMessage);
    }
  };

  const renderInput = (label, name, placeholder, type = 'text') => (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        value={form[name] || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        type={type}
        className={`rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 ${
          formErrors[name]
            ? 'border-red-500 focus:ring-red-200'
            : 'border-slate-200 focus:ring-[var(--theme-ring)]'
        }`}
      />
      {formErrors[name] && <span className="text-red-500 text-sm">{formErrors[name]}</span>}
    </label>
  );

  const renderSelect = (label, name, options) => (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        name={name}
        value={form[name] || ''}
        onChange={handleChange}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 ${
          formErrors[name]
            ? 'border-red-500 focus:ring-red-200'
            : 'border-slate-200 focus:ring-[var(--theme-ring)]'
        }`}
      >
        <option value="">Selecciona una opción</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {formErrors[name] && <p className="text-red-500 text-sm">{formErrors[name]}</p>}
    </label>
  );

  const renderCheckbox = (label, name) => (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
      <input
        type="checkbox"
        name={name}
        checked={Boolean(form[name])}
        onChange={handleChange}
        className="h-4 w-4 rounded border-slate-300 text-[var(--theme-accent)] focus:ring-[var(--theme-ring)]"
      />
      {label}
    </label>
  );

  const SectionCard = ({ title, description, children }) => (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm sm:px-6"
        >
          <Motion.div
            initial={{ scale: 0.98, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            className="relative flex w-full max-w-5xl max-h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur">
              <div>
                <h2 className="text-lg font-semibold">Editar trabajador</h2>
                <p className="text-sm text-slate-500">Actualiza la información manteniendo todos los campos completos.</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:space-y-5">
              <SectionCard
                title="Datos personales"
                description="Información básica de contacto y documentación."
              >
                {renderInput('Nombre', 'nombre', 'Ej: Juan Pérez')}
                {renderInput('DNI', 'dni', 'Ej: 12345678A')}
                {renderInput('Dirección', 'direccion', 'Ej: Calle Falsa 123')}
                {renderInput('Correo Electrónico', 'correo_electronico', 'Ej: juan@email.com')}
                {renderInput('Teléfono', 'telefono', 'Ej: 600123456')}
                {renderInput('IBAN', 'iban', 'Ej: ES7620770024003102575766')}
                {renderInput('NSS', 'nss', 'Ej: 123456789012')}
              </SectionCard>

              <SectionCard
                title="Contrato y condiciones"
                description="Define el tipo de contrato, fechas y la jornada."
              >
                {renderSelect('Tipo de contrato', 'tipo_trabajador', ['Fijo discontinuo', 'Fijo', 'Temporal', 'Prácticas'])}
                {renderInput('Grupo', 'grupo', 'Ej: G1')}
                {renderInput('Categoría', 'categoria', 'Ej: Oficial 1ª')}
                {renderInput('Fecha de Alta', 'fecha_alta', '', 'date')}
                {form.tipo_trabajador !== 'Fijo' && renderInput('Fecha de Baja', 'fecha_baja', '', 'date')}
                {renderInput('Horas Contratadas', 'horas_contratadas', 'Ej: 40', 'number')}
                <div className="sm:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {renderInput('Salario Neto/Mensual (€)', 'salario_neto', 'Ej: 1.600,50')}
                  {renderInput('Salario Bruto/Mensual (€)', 'salario_bruto', 'Ej: 1.800,75')}
                </div>
                {renderInput('Cliente', 'cliente', 'Ej: Indra, Amazon...')}
                {renderInput('País', 'pais', 'Ej: España')}
                {empresaOptions.length
                  ? renderSelect('Empresa', 'empresa', empresaOptions)
                  : renderInput('Empresa', 'empresa', 'Ej: Construcciones S.A.')}
              </SectionCard>

              <SectionCard
                title="Documentación y permisos"
                description="Marca los documentos disponibles y sus fechas."
              >
                <div className="col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {renderCheckbox('Tiene A1', 'a1')}
                  {renderCheckbox('Tiene EPIs', 'epis')}
                  {renderCheckbox('Desplazamiento', 'desplazamiento')}
                  {form.a1 && renderCheckbox('Tiene Limosa', 'limosa')}
                </div>
                {form.a1 && renderInput('Fecha A1', 'fecha_a1', '', 'date')}
                {form.a1 && renderInput('Fin A1', 'fechafin_a1', '', 'date')}
                {form.a1 && form.limosa && renderInput('Fecha Limosa', 'fecha_limosa', '', 'date')}
                {form.a1 && form.limosa && renderInput('Fin Limosa', 'fechafin_limosa', '', 'date')}
                {form.epis && renderInput('Fecha EPIs', 'fecha_epis', '', 'date')}
                {form.desplazamiento && renderInput('Fecha Desplazamiento', 'fecha_desplazamiento', '', 'date')}
              </SectionCard>

              <SectionCard
                title="Observaciones"
                description="Notas internas sobre las condiciones del trabajador."
              >
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Condiciones</span>
                  <textarea
                    name="condiciones"
                    placeholder="Ej: Contrato indefinido, jornada completa..."
                    value={form.condiciones || ''}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 ${
                      formErrors.condiciones
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[var(--theme-ring)]'
                    }`}
                  />
                  {formErrors.condiciones && <span className="text-red-500 text-sm">{formErrors.condiciones}</span>}
                </label>
              </SectionCard>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200/80 bg-white px-5 py-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                Guardar cambios
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

// src/components/forms/AddWorkerModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCurrency, formatCurrency } from '@/utils/utils';

export default function AddWorkerModal({ open, onClose, onWorkerAdded }) {
  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    correo_electronico: '',
    telefono: '',
    tipo_trabajador: '',
    grupo: '',
    categoria: '',
    iban: '',
    nss: '',
    fecha_alta: '',
    fecha_baja: '',
    horas_contratadas: '',
    salario_neto: '',
    salario_bruto:'',
    direccion: '',
    desplazamiento: false,
    fecha_desplazamiento: '',
    cliente: '',
    a1: false,
    fecha_limosa: '',
    condiciones: '',
    pais: '',
    epis: false,
    fecha_epis: '',
    empresa: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (["salario_neto", "salario_bruto"].includes(name)) {
      const formatted = value.replace(/[^0-9]/g, "");
      setForm((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
    setFormErrors((prev) => ({ ...prev, [name]: undefined })); // limpia error del campo al modificar
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
    if (form.a1 && !form.fecha_limosa) errors.fecha_limosa = 'Debe especificar la fecha A1';
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
      const token = localStorage.getItem('token');
      const parsedForm = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          if (value === '') return [key, null];
          if (["a1", "epis", "desplazamiento"].includes(key)) return [key, Boolean(value)];
          if (["salario_neto", "salario_bruto"].includes(key)) return [key, parseCurrency(value)];
          return [key, value];
        })
      );

      const response = await fetch(`${import.meta.env.VITE_API_URL}/trabajadores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parsedForm)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al añadir trabajador');
      }

      onWorkerAdded();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const renderInput = (label, name, placeholder, type = 'text') => (
    <label className="flex flex-col">
      {label}
      <input
        name={name}
        placeholder={placeholder}
        value={form[name] || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        type={type}
        className={`border p-2 rounded ${formErrors[name] ? 'border-red-500' : ''}`}
      />
      {formErrors[name] && <span className="text-red-500 text-sm">{formErrors[name]}</span>}
    </label>
  );
  const renderSelect = (label, name, options) => (
  <label>
    {label}
    <select
      name={name}
      value={form[name]}
      onChange={handleChange}
      className={`border p-2 rounded w-full ${
        formErrors[name] ? 'border-red-500' : 'border-gray-300'
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


  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white text-black rounded-md shadow-lg w-full max-w-4xl p-6 relative overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-2">Añadir Nuevo Trabajador</h2>
            <p className="text-sm text-gray-600 mb-4">Completa el formulario para registrar un nuevo trabajador.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput('Nombre', 'nombre', 'Ej: Juan Pérez')}
              {renderInput('DNI', 'dni', 'Ej: 12345678A')}
              {renderInput('Dirección', 'direccion', 'Ej: Calle Falsa 123')}
              {renderInput('Correo Electrónico', 'correo_electronico', 'Ej: juan@email.com')}
              {renderInput('Teléfono', 'telefono', 'Ej: 600123456')}
              {renderInput('IBAN', 'iban', 'Ej: ES7620770024003102575766')}
              {renderInput('NSS', 'nss', 'Ej: 123456789012')}
              {renderSelect('Tipo de contrato', 'tipo_trabajador', ['Fijo discontinuo', 'Fijo', 'Temporal', 'Prácticas'])}
              {renderInput('Grupo', 'grupo', 'Ej: G1')}
              {renderInput('Categoría', 'categoria', 'Ej: Oficial 1ª')}
              {renderInput('Fecha de Alta', 'fecha_alta', '', 'date')}
              {form.tipo_trabajador !== 'Fijo' &&
                renderInput('Fecha de Baja', 'fecha_baja', '', 'date')}
              {renderInput('Horas Contratadas', 'horas_contratadas', 'Ej: 40', 'number')}
              {renderInput('Salario Neto/Mes (€)', 'salario_neto', 'Ej: 1.600,50')}
              {renderInput('Salario Bruto/Mes (€)', 'salario_bruto', 'Ej: 1.800,75')}
              {renderInput('Cliente', 'cliente', 'Ej: Indra, Amazon...')}
              {renderInput('País', 'pais', 'Ej: España')}
              {renderInput('Empresa', 'empresa', 'Ej: Construcciones S.A.')}
              <label className="flex items-center gap-2 col-span-full">
                <input type="checkbox" name="a1" checked={form.a1} onChange={handleChange} /> ¿Tiene A1?
              </label>
              {form.a1 && renderInput('Fecha A1', 'fecha_limosa', '', 'date')}
              <label className="flex items-center gap-2 col-span-full">
                <input type="checkbox" name="epis" checked={form.epis} onChange={handleChange} /> ¿Tiene EPIs?
              </label>
              {form.epis && renderInput('Fecha EPIs', 'fecha_epis', '', 'date')}
              <label className="flex items-center gap-2 col-span-full">
                <input type="checkbox" name="desplazamiento" checked={form.desplazamiento} onChange={handleChange} /> ¿Desplazamiento?
              </label>
              {form.desplazamiento && renderInput('Fecha Desplazamiento', 'fecha_desplazamiento', '', 'date')}
              <label className="col-span-full">
                Condiciones
                <textarea
                  name="condiciones"
                  placeholder="Ej: Contrato indefinido, jornada completa..."
                  value={form.condiciones}
                  onChange={handleChange}
                  className={`border p-2 rounded w-full ${formErrors.condiciones ? 'border-red-500' : ''}`}
                />
                {formErrors.condiciones && <span className="text-red-500 text-sm">{formErrors.condiciones}</span>}
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancelar</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Añadir Trabajador</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

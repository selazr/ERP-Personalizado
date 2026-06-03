import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Plus, Save, Trash2, X } from 'lucide-react';

export default function FestivosGlobalModal({
    isOpen,
    onClose,
    currentDate,
    workerCount,
    onSave,
    initialDates = [],
}) {
    const [dates, setDates] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setDates(initialDates || []);
        }
    }, [isOpen, initialDates]);

    const addDate = () => {
        const defaultDate = format(currentDate, 'yyyy-MM-01');
        setDates((prev) => [...prev, defaultDate]);
    };

    const changeDate = (index, value) => {
        setDates((prev) =>
            prev.map((date, i) => (i === index ? value : date))
        );
    };

    const removeDate = (index) => {
        setDates((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const validDates = dates.filter(Boolean);
        onSave(validDates);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
                <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 shadow-xl">
                    <div className="border-b border-slate-200 bg-white px-5 py-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <Dialog.Title className="text-2xl font-bold text-slate-950">
                                    Festivos globales
                                </Dialog.Title>
                                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                    <CalendarDays className="h-4 w-4" />
                                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 px-5 py-5">
                        <p className="text-sm text-slate-600">
                            Los días seleccionados se marcarán como festivo para {workerCount} trabajadores.
                        </p>

                        <div className="space-y-2">
                            {dates.map((date, index) => (
                                <div key={index} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => changeDate(index, e.target.value)}
                                        className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm [color-scheme:light]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeDate(index)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                        title="Eliminar fecha"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addDate}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
                        >
                            <Plus className="h-4 w-4" />
                            Añadir festivo
                        </button>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
                        >
                            <Save className="h-4 w-4" />
                            Guardar festivos
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}

import { Dialog } from '@headlessui/react';

const actionCopy = {
  alta: {
    title: 'Dar de alta trabajador',
    description: 'Se reactivará el trabajador y quedará disponible en la lista activa.',
    confirmLabel: 'Dar de alta',
    panelAccent: 'border-emerald-500/60',
    buttonStyles: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500'
  },
  baja: {
    title: 'Dar de baja trabajador',
    description: 'El trabajador quedará marcado como inactivo a partir de hoy.',
    confirmLabel: 'Dar de baja',
    panelAccent: 'border-amber-500/70',
    buttonStyles: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400'
  }
};

export default function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  actionType = 'baja',
  workerName
}) {
  const copy = actionCopy[actionType] ?? actionCopy.baja;
  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" />
      <Dialog.Panel
        className={`relative z-10 w-full max-w-lg rounded-2xl border ${copy.panelAccent} bg-white p-6 shadow-xl`}
      >
        <Dialog.Title className="text-lg font-semibold text-slate-900">
          {copy.title}
        </Dialog.Title>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>{copy.description}</p>
          {workerName && (
            <p className="font-medium text-slate-800">
              Trabajador: <span className="font-semibold">{workerName}</span>
            </p>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 ${copy.buttonStyles}`}
          >
            {copy.confirmLabel}
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

import { useState } from 'react';
import { useIntentKey } from './useIntentKey';
import { portFailureMessage } from '../../../../model/portFailure';
import {
  EXTRA_ITEM_TYPE_LABELS,
  type ExtraItemDraft,
  type ExtraItemType,
} from '../../../../model/procedureCompletion';

export interface CompleteProcedureFormProps {
  readonly onComplete: (
    extras: readonly ExtraItemDraft[],
    idempotencyKey: string,
  ) => Promise<void>;
  readonly onCancel: () => void;
}

const blank: ExtraItemDraft = {
  category: 'MATERIAL',
  type: 'ADDITIONAL_MATERIAL',
  code: '',
  quantity: '',
  description: '',
  clinicalReason: '',
};

const TEXT_FIELDS = [
  ['code', 'Código (opcional)', 80],
  ['quantity', 'Cantidad', 20],
  ['description', 'Descripción', 500],
  ['clinicalReason', 'Justificación clínica', 1000],
] as const;

/** HU-CLN-002: clinical materials and needs only; prices belong to Billing. */
export function CompleteProcedureForm({
  onComplete,
  onCancel,
}: CompleteProcedureFormProps) {
  const [items, setItems] = useState<readonly ExtraItemDraft[]>([]);
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  // The form closes on success, so one key covers this completion intent.
  const [intentKey] = useIntentKey();
  const update = (index: number, change: Partial<ExtraItemDraft>) =>
    setItems(
      items.map((item, at) => (at === index ? { ...item, ...change } : item)),
    );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage(undefined);
    try {
      await onComplete(items, intentKey);
    } catch (error) {
      setMessage(
        portFailureMessage(error, 'No fue posible completar el procedimiento.'),
      );
      setPending(false);
    }
  }

  return (
    <form className="tp-form" onSubmit={submit} noValidate>
      <p>
        Materiales y necesidades clínicas (los precios se registran en
        Facturación).
      </p>
      {items.map((item, index) => (
        <fieldset key={index} className="tp-extra">
          <legend>Extra {index + 1}</legend>
          <label htmlFor={`extra-category-${index}`}>Categoría</label>
          <select
            id={`extra-category-${index}`}
            value={item.category}
            onChange={(event) =>
              update(index, {
                category: event.target.value as ExtraItemDraft['category'],
              })
            }
          >
            <option value="MATERIAL">Material utilizado</option>
            <option value="REQUIREMENT">Necesidad adicional</option>
          </select>
          <label htmlFor={`extra-type-${index}`}>Tipo</label>
          <select
            id={`extra-type-${index}`}
            value={item.type}
            onChange={(event) =>
              update(index, { type: event.target.value as ExtraItemType })
            }
          >
            {Object.entries(EXTRA_ITEM_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {TEXT_FIELDS.map(([field, label, maxLength]) => (
            <label key={field}>
              {label}
              <input
                value={item[field]}
                maxLength={maxLength}
                onChange={(event) =>
                  update(index, { [field]: event.target.value })
                }
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => setItems(items.filter((_, at) => at !== index))}
          >
            Quitar
          </button>
        </fieldset>
      ))}
      <button type="button" onClick={() => setItems([...items, blank])}>
        Agregar material o necesidad
      </button>
      {message && <p role="alert">{message}</p>}
      <div>
        <button type="submit" disabled={pending}>
          Registrar procedimiento completado
        </button>
        <button type="button" onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

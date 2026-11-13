export default function ServiceCard({ service, onTakeTicket, disabled, loading }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div>
        <h3 className="text-lg font-semibold text-[#26332D]">{service.name}</h3>
        {service.description && (
          <p className="mt-1 text-sm text-[#26332D]/70">{service.description}</p>
        )}
        <p className="mt-3 text-xs font-medium text-[#008F68]">
          Temps moyen : {service.avgServiceTime ?? "—"} min
        </p>
      </div>
      <button
        type="button"
        onClick={() => onTakeTicket(service)}
        disabled={disabled || loading}
        className="mt-4 w-full rounded-xl bg-[#008F68] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#006B50] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Prise en cours…" : "Prendre un ticket"}
      </button>
    </div>
  );
}
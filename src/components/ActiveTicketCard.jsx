import StatusBadge from "./StatusBadge";

export default function ActiveTicketCard({
  ticket,
  position,
  estimatedWait,
  onCancel,
  cancelling,
}) {
  const isCalled = ticket.status === "called";

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      {isCalled && (
        <div className="mb-4 rounded-2xl bg-[#DDF5EB] px-4 py-3 text-center text-sm font-bold text-[#006B50]">
          🎉 C'est votre tour !
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#26332D]/50">
            Votre numéro
          </p>
          <p className="mt-1 text-5xl font-extrabold text-[#008F68]">
            {ticket.number}
          </p>
          <p className="mt-2 text-sm font-medium text-[#26332D]">
            {ticket.serviceName}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#F4F7F5] p-4">
          <dt className="text-xs text-[#26332D]/60">Position</dt>
          <dd className="mt-1 text-2xl font-bold text-[#26332D]">
            {position ?? "—"}
          </dd>
        </div>
        <div className="rounded-2xl bg-[#F4F7F5] p-4">
          <dt className="text-xs text-[#26332D]/60">Attente estimée</dt>
          <dd className="mt-1 text-2xl font-bold text-[#26332D]">
            {estimatedWait ?? "—"}{" "}
            <span className="text-sm font-medium">min</span>
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onCancel}
       disabled={cancelling || ticket.status !== "waiting"}
        className="mt-6 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cancelling ? "Annulation…" : "Annuler mon ticket"}
      </button>
    </div>
  );
}
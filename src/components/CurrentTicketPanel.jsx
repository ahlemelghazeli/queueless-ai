import StatusBadge from "./StatusBadge";

export default function CurrentTicketPanel({
  ticket,
  onStart,
  onComplete,
  onAbsent,
  busy,
}) {
  if (!ticket) {
    return (
      <div className="rounded-3xl bg-white p-6 text-sm text-[#26332D]/60 shadow-sm ring-1 ring-black/5">
        Aucun ticket en cours. Appelez le prochain client.
      </div>
    );
  }

  const isCalled = ticket.status === "called";
  const isServing = ticket.status === "serving";

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#26332D]/50">
            Ticket en cours
          </p>
          <p className="mt-1 text-5xl font-extrabold text-[#008F68]">
            {ticket.number}
          </p>
          <p className="mt-2 text-sm font-medium text-[#26332D]">
            {ticket.clientName || "Client"}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {isCalled && (
          <>
            <button
              type="button"
              onClick={onStart}
              disabled={busy}
              className="flex-1 rounded-xl bg-[#008F68] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#006B50] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Patientez" : "Démarrer"}
            </button>
            <button
              type="button"
              onClick={onAbsent}
              disabled={busy}
              className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Absent
            </button>
          </>
        )}
        {isServing && (
          <button
            type="button"
            onClick={onComplete}
            disabled={busy}
            className="flex-1 rounded-xl bg-[#008F68] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#006B50] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Patientez..." : "Terminer"}
          </button>
        )}
      </div>
    </div>
  );
}
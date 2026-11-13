function formatTime(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QueueList({ tickets }) {
  if (tickets.length === 0) {
    return (
      <p className="text-sm text-[#26332D]/60">
        Aucun client en attente pour le moment.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      {tickets.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF5EB] text-sm font-bold text-[#006B50]">
              {t.number}
            </span>
            <div>
              <p className="text-sm font-semibold text-[#26332D]">
                {t.clientName || "Client"}
              </p>
              <p className="text-xs text-[#26332D]/50">
                Arrivé à {formatTime(t.createdAt)}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
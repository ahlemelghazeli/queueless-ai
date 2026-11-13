const STATUS_MAP = {
  waiting: { label: "En attente", classes: "bg-amber-100 text-amber-800" },
  called: { label: "Appelé", classes: "bg-[#DDF5EB] text-[#006B50]" },
  serving: { label: "En cours", classes: "bg-blue-100 text-blue-800" },
  done: { label: "Terminé", classes: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Annulé", classes: "bg-red-100 text-red-700" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || {
    label: status,
    classes: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
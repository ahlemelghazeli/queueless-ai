import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";
import ServiceCard from "../../components/ServiceCard";
import ActiveTicketCard from "../../components/ActiveTicketCard";
import {
  subscribeActiveServices,
  subscribeActiveTicket,
  subscribeTicketHistory,
  subscribeQueuePosition,
  createTicket,
  cancelTicket,
} from "../../services/ticketService";

function formatDate(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClientDashboard() {
  const { user, logout } = useAuth();

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");

  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [position, setPosition] = useState(null);
  const [takingTicket, setTakingTicket] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState("");

  // Services actifs
  useEffect(() => {
    setServicesLoading(true);
    const unsub = subscribeActiveServices(
      (list) => {
        setServices(list);
        setServicesLoading(false);
      },
      () => {
        setServicesError("Impossible de charger les services.");
        setServicesLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Ticket actif
  useEffect(() => {
    if (!user) return;
    setTicketLoading(true);
    const unsub = subscribeActiveTicket(
      user.uid,
      (ticket) => {
        setActiveTicket(ticket);
        setTicketLoading(false);
      },
      () => {
        setTicketError("Impossible de charger votre ticket.");
        setTicketLoading(false);
      }
    );
    return () => unsub();
   }, [user?.uid]);

  // Historique
  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    const unsub = subscribeTicketHistory(
      user.uid,
      (list) => {
        setHistory(list);
        setHistoryLoading(false);
      },
      () => {
        setHistoryError("Impossible de charger votre historique.");
        setHistoryLoading(false);
      }
    );
    return () => unsub();
    }, [user?.uid]);

  // Position dans la file du ticket actif
  useEffect(() => {
    if (!activeTicket) {
      setPosition(null);
      return;
    }
    const unsub = subscribeQueuePosition(
      activeTicket,
      (pos) => setPosition(pos),
      () => setPosition(null)
    );
    return () => unsub();
   }, [activeTicket?.id, activeTicket?.serviceId, activeTicket?.number]);

  const serviceForTicket = useMemo(
    () => services.find((s) => s.id === activeTicket?.serviceId),
    [services, activeTicket]
  );

  const avgTime = serviceForTicket?.avgServiceTime ?? 0;

  const estimatedWait = useMemo(() => {
    if (!activeTicket || activeTicket.status !== "waiting") return null;
    if (position == null) return null;
    return Math.max(0, (position - 1) * avgTime);
  }, [activeTicket, position, avgTime]);

  const handleTakeTicket = useCallback(
    async (service) => {
      setActionError("");
      setTakingTicket(true);
      try {
        await createTicket(service, user);
      } catch (err) {
        setActionError(err.message || "Erreur lors de la prise du ticket.");
      } finally {
        setTakingTicket(false);
      }
    },
    [user]
  );

  const handleCancel = useCallback(async () => {
    if (!activeTicket) return;
    setActionError("");
    setCancelling(true);
    try {
      await cancelTicket(activeTicket.id);
    } catch {
      setActionError("Erreur lors de l'annulation du ticket.");
    } finally {
      setCancelling(false);
    }
  }, [activeTicket]);

  const hasActive = Boolean(activeTicket);

  return (
    <div className="min-h-screen bg-[#F4F7F5] font-[Inter]">
      {/* En-tête */}
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#008F68]">
              QueueLess AI
            </p>
            <h1 className="text-lg font-bold text-[#26332D]">
              Bonjour {user?.displayName || "Client"}
            </h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#26332D] transition hover:bg-[#F4F7F5]"
          >
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        {actionError && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {actionError}
          </div>
        )}

        {/* Ticket actif */}
        <section>
          <h2 className="mb-3 text-base font-bold text-[#26332D]">
            Mon ticket
          </h2>
          {ticketLoading ? (
            <p className="text-sm text-[#26332D]/60">Chargement…</p>
          ) : ticketError ? (
            <p className="text-sm text-red-600">{ticketError}</p>
          ) : activeTicket ? (
            <ActiveTicketCard
              ticket={activeTicket}
              position={activeTicket.status === "waiting" ? position : null}
              estimatedWait={estimatedWait}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ) : (
            <div className="rounded-2xl bg-white p-6 text-sm text-[#26332D]/60 shadow-sm ring-1 ring-black/5">
              Vous n'avez aucun ticket actif. Choisissez un service ci-dessous.
            </div>
          )}
        </section>

        {/* Services */}
        <section>
          <h2 className="mb-3 text-base font-bold text-[#26332D]">
            Services disponibles
          </h2>

          {hasActive && (
            <p className="mb-3 rounded-xl bg-[#DDF5EB] px-4 py-2 text-xs font-medium text-[#006B50]">
              Vous avez déjà un ticket actif. Annulez-le pour en prendre un nouveau.
            </p>
          )}

          {servicesLoading ? (
            <p className="text-sm text-[#26332D]/60">Chargement des services…</p>
          ) : servicesError ? (
            <p className="text-sm text-red-600">{servicesError}</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-[#26332D]/60">
              Aucun service disponible pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onTakeTicket={handleTakeTicket}
                  disabled={hasActive}
                  loading={takingTicket}
                />
              ))}
            </div>
          )}
        </section>

        {/* Historique */}
        <section>
          <h2 className="mb-3 text-base font-bold text-[#26332D]">
            Mon historique
          </h2>
          {historyLoading ? (
            <p className="text-sm text-[#26332D]/60">Chargement…</p>
          ) : historyError ? (
            <p className="text-sm text-red-600">{historyError}</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-[#26332D]/60">
              Aucun ticket dans votre historique.
            </p>
          ) : (
            <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {history.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF5EB] text-sm font-bold text-[#006B50]">
                      {t.number}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#26332D]">
                        {t.serviceName}
                      </p>
                      <p className="text-xs text-[#26332D]/50">
                        {formatDate(t.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
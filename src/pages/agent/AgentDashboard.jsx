import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import QueueList from "../../components/QueueList";
import CurrentTicketPanel from "../../components/CurrentTicketPanel";
import {
  subscribeServiceQueue,
  subscribeAgentCurrentTicket,
  callNextTicket,
  startServing,
  completeTicket,
  markAbsent,
} from "../../services/agentService";

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const uid = user?.uid;

  // Profil agent (serviceId + nom du service)
  const [serviceId, setServiceId] = useState(null);
  const [serviceName, setServiceName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");

  const [current, setCurrent] = useState(null);
  const [currentLoading, setCurrentLoading] = useState(true);
  const [currentError, setCurrentError] = useState("");

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  // Profil agent
  useEffect(() => {
    if (!uid) return;
    setProfileLoading(true);
    const unsubUser = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (!snap.exists()) {
          setProfileError("Profil introuvable.");
          setProfileLoading(false);
          return;
        }
        const data = snap.data();
        setServiceId(data.serviceId || null);
        setProfileLoading(false);
      },
      () => {
        setProfileError("Impossible de charger votre profil.");
        setProfileLoading(false);
      }
    );
    return () => unsubUser();
  }, [uid]);

  // Nom du service
  useEffect(() => {
    if (!serviceId) {
      setServiceName("");
      return;
    }
    const unsub = onSnapshot(
      doc(db, "services", serviceId),
      (snap) => {
        if (snap.exists()) {
          setServiceName(snap.data().name || "");
        }
      },
      () => {}
    );
    return () => unsub();
  }, [serviceId]);

  // File d'attente
  useEffect(() => {
    if (!serviceId) {
      setQueue([]);
      setQueueLoading(false);
      return;
    }
    setQueueLoading(true);
    const unsub = subscribeServiceQueue(
      serviceId,
      (list) => {
        setQueue(list);
        setQueueLoading(false);
      },
      () => {
        setQueueError("Impossible de charger la file d'attente.");
        setQueueLoading(false);
      }
    );
    return () => unsub();
  }, [serviceId]);

  // Ticket en cours de l'agent
  useEffect(() => {
    if (!uid) return;
    setCurrentLoading(true);
    const unsub = subscribeAgentCurrentTicket(
      uid,
      (ticket) => {
        setCurrent(ticket);
        setCurrentLoading(false);
      },
      () => {
        setCurrentError("Impossible de charger votre ticket en cours.");
        setCurrentLoading(false);
      }
    );
    return () => unsub();
  }, [uid]);

  const handleCallNext = useCallback(async () => {
    if (!serviceId || !uid) return;
    setActionError("");
    setBusy(true);
    try {
      await callNextTicket(serviceId, uid);
    } catch (err) {
      setActionError(err.message || "Erreur lors de l'appel du prochain ticket.");
    } finally {
      setBusy(false);
    }
  }, [serviceId, uid]);

  const handleStart = useCallback(async () => {
    if (!current) return;
    setActionError("");
    setBusy(true);
    try {
      await startServing(current.id);
    } catch {
      setActionError("Erreur lors du démarrage du ticket.");
    } finally {
      setBusy(false);
    }
  }, [current]);

  const handleComplete = useCallback(async () => {
    if (!current) return;
    setActionError("");
    setBusy(true);
    try {
      await completeTicket(current.id);
    } catch {
      setActionError("Erreur lors de la clôture du ticket.");
    } finally {
      setBusy(false);
    }
  }, [current]);

  const handleAbsent = useCallback(async () => {
    if (!current) return;
    setActionError("");
    setBusy(true);
    try {
      await markAbsent(current.id);
    } catch {
      setActionError("Erreur lors du marquage d'absence.");
    } finally {
      setBusy(false);
    }
  }, [current]);

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7F5] font-[Inter]">
        <p className="text-sm text-[#26332D]/60">Chargement…</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7F5] font-[Inter]">
        <p className="text-sm text-red-600">{profileError}</p>
      </div>
    );
  }

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] font-[Inter]">
        <header className="border-b border-black/5 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <h1 className="text-lg font-bold text-[#26332D]">
              Bonjour {user?.displayName || "Agent"}
            </h1>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#26332D] transition hover:bg-[#F4F7F5]"
            >
              Se déconnecter
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl bg-white p-6 text-sm text-[#26332D]/70 shadow-sm ring-1 ring-black/5">
            Aucun service ne vous est affecté, contactez l'administrateur.
          </div>
        </main>
      </div>
    );
  }

  const hasCurrent = Boolean(current);
  const canCallNext = !hasCurrent && queue.length > 0 && !busy;

  return (
    <div className="min-h-screen bg-[#F4F7F5] font-[Inter]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#008F68]">
              QueueLess AI — Agent
            </p>
            <h1 className="text-lg font-bold text-[#26332D]">
              {user?.displayName || "Agent"}
            </h1>
            <p className="text-sm text-[#26332D]/60">
              Service : {serviceName || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="self-start rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#26332D] transition hover:bg-[#F4F7F5] sm:self-auto"
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

        {/* Compteur + bouton */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
            <p className="text-xs text-[#26332D]/60">Clients en attente</p>
            <p className="text-2xl font-bold text-[#26332D]">
              {queueLoading ? "…" : queue.length}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCallNext}
            disabled={!canCallNext}
            className="rounded-xl bg-[#008F68] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006B50] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Patientez…" : "Appeler le prochain"}
          </button>
        </section>

        {/* Ticket en cours */}
        <section>
          <h2 className="mb-3 text-base font-bold text-[#26332D]">
            Ticket en cours
          </h2>
          {currentLoading ? (
            <p className="text-sm text-[#26332D]/60">Chargement…</p>
          ) : currentError ? (
            <p className="text-sm text-red-600">{currentError}</p>
          ) : (
            <CurrentTicketPanel
              ticket={current}
              onStart={handleStart}
              onComplete={handleComplete}
              onAbsent={handleAbsent}
              busy={busy}
            />
          )}
        </section>

        {/* File d'attente */}
        <section>
          <h2 className="mb-3 text-base font-bold text-[#26332D]">
            File d'attente
          </h2>
          {queueLoading ? (
            <p className="text-sm text-[#26332D]/60">Chargement…</p>
          ) : queueError ? (
            <p className="text-sm text-red-600">{queueError}</p>
          ) : (
            <QueueList tickets={queue} />
          )}
        </section>
      </main>
    </div>
  );
}
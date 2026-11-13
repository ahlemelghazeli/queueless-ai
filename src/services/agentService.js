import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

// File d'attente du service (temps réel, tri par numéro croissant côté client)
export function subscribeServiceQueue(serviceId, callback, onError) {
  const q = query(
    collection(db, "tickets"),
    where("serviceId", "==", serviceId),
    where("status", "==", "waiting")
  );
  return onSnapshot(
    q,
    (snap) => {
      const tickets = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
      callback(tickets);
    },
    (err) => onError && onError(err)
  );
}

// Ticket en cours de l'agent (called ou serving)
export function subscribeAgentCurrentTicket(agentId, callback, onError) {
  const q = query(
    collection(db, "tickets"),
    where("agentId", "==", agentId),
    where("status", "in", ["called", "serving"])
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const d = snap.docs[0];
      callback({ id: d.id, ...d.data() });
    },
    (err) => onError && onError(err)
  );
}

// Appeler le prochain ticket
export async function callNextTicket(serviceId, agentId) {
  // Vérifie que l'agent n'a pas déjà un ticket en cours
  const currentQ = query(
    collection(db, "tickets"),
    where("agentId", "==", agentId),
    where("status", "in", ["called", "serving"])
  );
  const currentSnap = await getDocs(currentQ);
  if (!currentSnap.empty) {
    throw new Error("Vous avez déjà un ticket en cours. Terminez-le d'abord.");
  }

  // Récupère le waiting au plus petit numéro
  const waitQ = query(
    collection(db, "tickets"),
    where("serviceId", "==", serviceId),
    where("status", "==", "waiting")
  );
  const waitSnap = await getDocs(waitQ);
  if (waitSnap.empty) {
    throw new Error("Aucun client en attente pour le moment.");
  }

  const candidates = waitSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  const nextTicket = candidates[0];

  const ticketRef = doc(db, "tickets", nextTicket.id);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ticketRef);
    if (!snap.exists()) {
      throw new Error("Ce ticket n'existe plus.");
    }
    const data = snap.data();
    if (data.status !== "waiting") {
      throw new Error("Ce ticket a déjà été pris par un autre agent. Réessayez.");
    }
    transaction.update(ticketRef, {
      status: "called",
      agentId,
      calledAt: serverTimestamp(),
    });
    return { id: nextTicket.id, number: data.number };
  });
}

export async function startServing(ticketId) {
  await updateDoc(doc(db, "tickets", ticketId), { status: "serving" });
}

export async function completeTicket(ticketId) {
  await updateDoc(doc(db, "tickets", ticketId), {
    status: "done",
    doneAt: serverTimestamp(),
  });
}

export async function markAbsent(ticketId) {
  await updateDoc(doc(db, "tickets", ticketId), {
    status: "cancelled",
    doneAt: serverTimestamp(),
  });
}
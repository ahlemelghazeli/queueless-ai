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

// Écoute temps réel des services actifs
export function subscribeActiveServices(callback, onError) {
  const q = query(
    collection(db, "services"),
    where("active", "==", true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const services = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(services);
    },
    (err) => onError && onError(err)
  );
}

// Vérifie si le client a déjà un ticket actif (waiting ou called)
async function hasActiveTicket(clientId) {
  const q = query(
    collection(db, "tickets"),
    where("clientId", "==", clientId),
   where("status", "in", ["waiting", "called", "serving"])
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// Création d'un ticket avec transaction (incrément de lastNumber)
export async function createTicket(service, user) {
  if (await hasActiveTicket(user.uid)) {
    throw new Error("Vous avez déjà un ticket actif. Annulez-le avant d'en prendre un nouveau.");
  }

  const serviceRef = doc(db, "services", service.id);
  const ticketsCol = collection(db, "tickets");

  return runTransaction(db, async (transaction) => {
    const serviceSnap = await transaction.get(serviceRef);
    if (!serviceSnap.exists()) {
      throw new Error("Service introuvable.");
    }
    const data = serviceSnap.data();
    if (!data.active) {
      throw new Error("Ce service est actuellement fermé.");
    }
    const nextNumber = (data.lastNumber || 0) + 1;
    transaction.update(serviceRef, { lastNumber: nextNumber });

    const newTicketRef = doc(ticketsCol);
    transaction.set(newTicketRef, {
      number: nextNumber,
      serviceId: service.id,
      serviceName: data.name,
      clientId: user.uid,
      clientName: user.displayName || "Client",
      status: "waiting",
      agentId: null,
      createdAt: serverTimestamp(),
      calledAt: null,
      doneAt: null,
    });

    return { id: newTicketRef.id, number: nextNumber };
  });
}

// Annuler un ticket
export async function cancelTicket(ticketId) {
  const ref = doc(db, "tickets", ticketId);
  await updateDoc(ref, { status: "cancelled" });
}

// Écoute temps réel du ticket actif du client
export function subscribeActiveTicket(clientId, callback, onError) {
  const q = query(
    collection(db, "tickets"),
    where("clientId", "==", clientId),
    where("status", "in", ["waiting", "called", "serving"])
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

// Écoute temps réel de l'historique du client (tickets terminés/annulés)
export function subscribeTicketHistory(clientId, callback, onError) {
  const q = query(
  collection(db, "tickets"),
  where("clientId", "==", clientId),
  where("status", "in", ["done", "cancelled"])
);
return onSnapshot(
  q,
  (snap) => {
    const tickets = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    callback(tickets);
  },
  (err) => onError && onError(err)
);
}

// Calcul de la position dans la file : tickets "waiting" du même service créés avant le sien + 1
export function subscribeQueuePosition(ticket, callback, onError) {
  if (!ticket) {
    callback(null);
    return () => {};
  }
  const q = query(
    collection(db, "tickets"),
    where("serviceId", "==", ticket.serviceId),
    where("status", "==", "waiting")
  );
  return onSnapshot(
    q,
    (snap) => {
      const ahead = snap.docs.filter(
        (d) => d.id !== ticket.id && d.data().number < ticket.number
      ).length;
      callback(ahead + 1);
    },
    (err) => onError && onError(err)
  );
}

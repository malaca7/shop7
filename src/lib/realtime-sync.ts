import mqtt, { type MqttClient } from "mqtt";
import type { Ad, Order, Profile } from "./supabase";
import { generateValidUuid } from "./utils";

// Tópico global do SHOP7 para sincronização universal em tempo real entre todas as telas e dispositivos
const SYNC_TOPIC = "shop7/global_sync/v1";
const STATE_TOPIC = "shop7/global_sync/state/v1";

const BROKERS = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
];

const LOCAL_ADS_KEY = "shop7_local_ads_v1";
const LOCAL_PROFILES_KEY = "shop7_local_profiles_v1";
const LOCAL_ORDERS_KEY = "shop7_local_orders_v1";
const DELETED_PROFILES_KEY = "shop7_deleted_profiles_v1";

export const ROOT_ADMIN_EMAILS = [
  "malacarogeriojr@gmail.com",
];

export function isRootAdminKey(idOrEmail?: string | null): boolean {
  if (!idOrEmail) return false;
  const k = idOrEmail.toLowerCase().trim();
  if (k === "malacarogeriojr@gmail.com") return true;
  if (k === "00000000-0000-4000-8000-000000000001") return true;
  if (k === generateValidUuid("malacarogeriojr@gmail.com")) return true;
  return false;
}

export const ROOT_ADMINS_DEFAULT: Profile[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: "malacarogeriojr@gmail.com",
    full_name: "malaca",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    role: "admin",
    created_at: "2026-10-03T13:54:28.419Z",
    updated_at: "2026-10-03T13:54:28.419Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "rogeriomalaquiasjr@gmail.com",
    full_name: "Rogério Malaquias",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    role: "user",
    created_at: "2026-10-03T13:54:28.419Z",
    updated_at: "2026-10-03T13:54:28.419Z",
  },
];

export type SyncMessage =
  | { type: "PROFILE_UPSERT"; payload: Profile; senderId: string; timestamp: number }
  | { type: "PROFILE_DELETE"; payload: { id: string; email?: string }; senderId: string; timestamp: number }
  | { type: "AD_UPSERT"; payload: Ad; senderId: string; timestamp: number }
  | { type: "AD_DELETE"; payload: { id: string }; senderId: string; timestamp: number }
  | { type: "ORDER_UPSERT"; payload: Order; senderId: string; timestamp: number }
  | { type: "ORDER_DELETE"; payload: { id: string }; senderId: string; timestamp: number }
  | { type: "REQUEST_FULL_STATE"; senderId: string; timestamp: number }
  | { type: "SEND_FULL_STATE"; payload: { profiles: Profile[]; ads: Ad[]; orders: Order[] }; senderId: string; timestamp: number };

class RealtimeSyncEngine {
  private client: MqttClient | null = null;
  private clientId: string;
  private listeners: Set<(type: "ads" | "profiles" | "orders" | "all") => void> = new Set();
  private isConnecting = false;
  private currentBrokerIndex = 0;
  private lastStateSyncResponse = 0;

  constructor() {
    this.clientId = "shop7_client_" + Math.random().toString(36).substring(2, 10);
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private init() {
    this.ensureDefaultAdminsSeeded();
    this.connect();

    // BroadcastChannel para sincronização instantânea intra-navegador
    if ("BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel("shop7_sync_bus");
        bc.onmessage = (e) => {
          if (e.data?.type) {
            this.notifyListeners(e.data.type);
          }
        };
      } catch {}
    }

    // Storage event para abas do mesmo navegador
    window.addEventListener("storage", (e) => {
      if (e.key === LOCAL_ADS_KEY) this.notifyListeners("ads");
      if (e.key === LOCAL_PROFILES_KEY) this.notifyListeners("profiles");
      if (e.key === LOCAL_ORDERS_KEY) this.notifyListeners("orders");
    });
  }

  public ensureDefaultAdminsSeeded() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
      let list: Profile[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      const deletedRaw = localStorage.getItem(DELETED_PROFILES_KEY);
      let deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!Array.isArray(deletedList)) deletedList = [];

      // Higienizar deletedSet para nunca conter os e-mails e IDs dos administradores mestres
      const cleanedDeletedList = deletedList.filter((k) => !isRootAdminKey(k));
      if (cleanedDeletedList.length !== deletedList.length) {
        localStorage.setItem(DELETED_PROFILES_KEY, JSON.stringify(cleanedDeletedList));
      }

      let changed = false;
      for (const defAdm of ROOT_ADMINS_DEFAULT) {
        const idLower = defAdm.id.toLowerCase().trim();
        const emailLower = (defAdm.email || "").toLowerCase().trim();

        const idx = list.findIndex(
          (p) =>
            p.email?.toLowerCase().trim() === emailLower ||
            p.id.toLowerCase().trim() === idLower ||
            (isRootAdminKey(p.id) && isRootAdminKey(defAdm.id) && (p.email || "").toLowerCase().trim() === emailLower)
        );
        if (idx >= 0) {
          if (list[idx].id !== defAdm.id) {
            list[idx].id = defAdm.id;
            changed = true;
          }
          if (list[idx].email !== defAdm.email) {
            list[idx].email = defAdm.email;
            changed = true;
          }
          if (!list[idx].full_name || list[idx].full_name === "Usuário") {
            list[idx].full_name = defAdm.full_name;
            changed = true;
          }
          if (list[idx].role !== defAdm.role) {
            list[idx].role = defAdm.role;
            changed = true;
          }
        } else {
          list.push(defAdm);
          changed = true;
        }
      }

      // Deduplica por e-mail para nunca duplicar
      const seen = new Set<string>();
      const deduplicated: Profile[] = [];
      for (const item of list) {
        const email = (item.email || "").toLowerCase().trim();
        if (email) {
          if (seen.has(email)) {
            changed = true;
            continue;
          }
          seen.add(email);
        }
        deduplicated.push(item);
      }

      if (changed || deduplicated.length !== list.length || !raw) {
        localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(deduplicated));
      }
    } catch {}
  }

  private connect() {
    if (this.client || this.isConnecting || typeof window === "undefined") return;
    this.isConnecting = true;

    const brokerUrl = BROKERS[this.currentBrokerIndex % BROKERS.length];

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
        keepalive: 30,
      });

      this.client.on("connect", () => {
        this.isConnecting = false;
        if (this.client) {
          this.client.subscribe([SYNC_TOPIC, STATE_TOPIC], { qos: 0 }, (err) => {
            if (!err) {
              this.requestFullState();
            }
          });
        }
      });

      this.client.on("message", (topic, messageBuffer) => {
        try {
          const msgStr = messageBuffer.toString();
          const data: SyncMessage = JSON.parse(msgStr);
          if (data.senderId === this.clientId) {
            return;
          }
          this.handleIncomingMessage(topic, data);
        } catch (err) {
          console.warn("[SHOP7 Realtime Engine] Erro ao decodificar mensagem:", err);
        }
      });

      this.client.on("error", (err) => {
        this.client?.end(true);
        this.client = null;
        this.isConnecting = false;
        this.currentBrokerIndex++;
        setTimeout(() => this.connect(), 2000);
      });

      this.client.on("close", () => {
        this.isConnecting = false;
      });
    } catch (e) {
      this.isConnecting = false;
      this.currentBrokerIndex++;
      setTimeout(() => this.connect(), 3000);
    }
  }

  private handleIncomingMessage(topic: string, msg: SyncMessage) {
    switch (msg.type) {
      case "PROFILE_UPSERT": {
        this.applyProfileUpsert(msg.payload);
        break;
      }
      case "PROFILE_DELETE": {
        this.applyProfileDelete(msg.payload.id, msg.payload.email);
        break;
      }
      case "AD_UPSERT": {
        this.applyAdUpsert(msg.payload);
        break;
      }
      case "AD_DELETE": {
        this.applyAdDelete(msg.payload.id);
        break;
      }
      case "ORDER_UPSERT": {
        this.applyOrderUpsert(msg.payload);
        break;
      }
      case "ORDER_DELETE": {
        this.applyOrderDelete(msg.payload.id);
        break;
      }
      case "REQUEST_FULL_STATE": {
        this.respondWithFullState();
        break;
      }
      case "SEND_FULL_STATE": {
        this.applyFullState(msg.payload);
        break;
      }
    }
  }

  private applyProfileUpsert(profile: Profile) {
    if (!profile || !profile.id) return;
    const email = (profile.email || "").toLowerCase().trim();
    if (!email || email === "usuario@shop7.com" || profile.id.includes("demo")) return;

    try {
      const delRaw = localStorage.getItem(DELETED_PROFILES_KEY);
      const delSet = new Set(
        delRaw ? (JSON.parse(delRaw) as string[]).map((k) => k.toLowerCase().trim()) : []
      );
      if (!isRootAdminKey(profile.id) && !isRootAdminKey(email)) {
        if (delSet.has(profile.id.toLowerCase().trim()) || (email && delSet.has(email))) {
          // Se este perfil foi explicitamente deletado e não é admin mestre, ignora
          return;
        }
      }

      const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
      let list: Profile[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      const idx = list.findIndex(
        (p) =>
          p.id.toLowerCase().trim() === profile.id.toLowerCase().trim() ||
          (email && p.email?.toLowerCase().trim() === email)
      );

      if (idx >= 0) {
        list[idx] = { ...list[idx], ...profile };
      } else {
        list.unshift(profile);
      }

      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
      this.notifyListeners("profiles");
    } catch (e) {
      console.warn("Erro ao mesclar perfil recebido em tempo real:", e);
    }
  }

  private applyProfileDelete(id: string, email?: string) {
    try {
      const targetId = (id || "").toLowerCase().trim();
      const targetEmail = (email || "").toLowerCase().trim();

      if (isRootAdminKey(targetId) || (targetEmail && isRootAdminKey(targetEmail))) {
        return; // Nunca remove administradores mestres da plataforma
      }

      const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
      let list: Profile[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      list = list.filter(
        (p) =>
          p.id.toLowerCase().trim() !== targetId &&
          (!targetEmail || p.email?.toLowerCase().trim() !== targetEmail)
      );

      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));

      const delRaw = localStorage.getItem(DELETED_PROFILES_KEY);
      const delSet = new Set(
        delRaw ? (JSON.parse(delRaw) as string[]).map((k) => k.toLowerCase().trim()) : []
      );
      if (targetId && !isRootAdminKey(targetId)) delSet.add(targetId);
      if (targetEmail && !isRootAdminKey(targetEmail)) delSet.add(targetEmail);
      localStorage.setItem(DELETED_PROFILES_KEY, JSON.stringify(Array.from(delSet)));

      this.notifyListeners("profiles");
    } catch (e) {}
  }

  private applyAdUpsert(ad: Ad) {
    if (!ad || !ad.id) return;
    try {
      const raw = localStorage.getItem(LOCAL_ADS_KEY);
      let list: Ad[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      const idx = list.findIndex((a) => a.id === ad.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...ad };
      } else {
        list.unshift(ad);
      }

      localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(list));
      this.notifyListeners("ads");
    } catch (e) {}
  }

  private applyAdDelete(id: string) {
    try {
      const raw = localStorage.getItem(LOCAL_ADS_KEY);
      let list: Ad[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      list = list.filter((a) => a.id !== id);
      localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(list));
      this.notifyListeners("ads");
    } catch (e) {}
  }

  private applyOrderUpsert(order: Order) {
    if (!order || !order.id) return;
    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      let list: Order[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      const idx = list.findIndex((o) => o.id === order.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...order };
      } else {
        list.unshift(order);
      }

      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
      this.notifyListeners("orders");
    } catch (e) {}
  }

  private applyOrderDelete(id: string) {
    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      let list: Order[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      list = list.filter((o) => o.id !== id);
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
      this.notifyListeners("orders");
    } catch (e) {}
  }

  private applyFullState(payload: { profiles: Profile[]; ads: Ad[]; orders: Order[] }) {
    if (!payload) return;
    try {
      // 1. Perfis
      if (Array.isArray(payload.profiles) && payload.profiles.length > 0) {
        const rawP = localStorage.getItem(LOCAL_PROFILES_KEY);
        let currentP: Profile[] = rawP ? JSON.parse(rawP) : [];
        if (!Array.isArray(currentP)) currentP = [];

        const delRaw = localStorage.getItem(DELETED_PROFILES_KEY);
        const delSet = new Set(
          delRaw ? (JSON.parse(delRaw) as string[]).map((k) => k.toLowerCase().trim()) : []
        );

        const map = new Map<string, Profile>();
        for (const p of currentP) {
          const em = (p.email || "").toLowerCase().trim();
          const idL = p.id.toLowerCase().trim();
          if (isRootAdminKey(idL) || isRootAdminKey(em) || (!delSet.has(idL) && (!em || !delSet.has(em)))) {
            map.set(idL, p);
          }
        }
        for (const p of payload.profiles) {
          const em = (p.email || "").toLowerCase().trim();
          const idL = p.id.toLowerCase().trim();
          if (!isRootAdminKey(idL) && !isRootAdminKey(em)) {
            if (delSet.has(idL) || (em && delSet.has(em))) continue;
          }
          if (em === "usuario@shop7.com" || p.id.includes("demo")) continue;

          const existing = map.get(idL);
          if (existing) {
            const tExist = new Date(existing.updated_at || existing.created_at || 0).getTime();
            const tNew = new Date(p.updated_at || p.created_at || 0).getTime();
            if (tNew >= tExist) {
              map.set(idL, { ...existing, ...p });
            }
          } else {
            map.set(idL, p);
          }
        }

        const mergedProfiles = Array.from(map.values());
        localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(mergedProfiles));
        this.notifyListeners("profiles");
      }

      // 2. Anúncios
      if (Array.isArray(payload.ads) && payload.ads.length > 0) {
        const rawA = localStorage.getItem(LOCAL_ADS_KEY);
        let currentA: Ad[] = rawA ? JSON.parse(rawA) : [];
        if (!Array.isArray(currentA)) currentA = [];

        const mapA = new Map<string, Ad>();
        for (const a of currentA) mapA.set(a.id, a);
        for (const a of payload.ads) {
          const existing = mapA.get(a.id);
          if (existing) {
            const tExist = new Date(existing.updated_at || existing.created_at || 0).getTime();
            const tNew = new Date(a.updated_at || a.created_at || 0).getTime();
            if (tNew >= tExist) mapA.set(a.id, { ...existing, ...a });
          } else {
            mapA.set(a.id, a);
          }
        }
        localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(Array.from(mapA.values())));
        this.notifyListeners("ads");
      }

      // 3. Pedidos
      if (Array.isArray(payload.orders) && payload.orders.length > 0) {
        const rawO = localStorage.getItem(LOCAL_ORDERS_KEY);
        let currentO: Order[] = rawO ? JSON.parse(rawO) : [];
        if (!Array.isArray(currentO)) currentO = [];

        const mapO = new Map<string, Order>();
        for (const o of currentO) mapO.set(o.id, o);
        for (const o of payload.orders) {
          const existing = mapO.get(o.id);
          if (existing) {
            const tExist = new Date(existing.updated_at || existing.created_at || 0).getTime();
            const tNew = new Date(o.updated_at || o.created_at || 0).getTime();
            if (tNew >= tExist) mapO.set(o.id, { ...existing, ...o });
          } else {
            mapO.set(o.id, o);
          }
        }
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(Array.from(mapO.values())));
        this.notifyListeners("orders");
      }
    } catch (e) {
      console.warn("Erro ao processar estado completo recebido:", e);
    }
  }

  private respondWithFullState() {
    const now = Date.now();
    if (now - this.lastStateSyncResponse < 3000) return;
    this.lastStateSyncResponse = now;

    try {
      const rawP = localStorage.getItem(LOCAL_PROFILES_KEY);
      const profiles: Profile[] = rawP ? JSON.parse(rawP) : [];

      const rawA = localStorage.getItem(LOCAL_ADS_KEY);
      const ads: Ad[] = rawA ? JSON.parse(rawA) : [];

      const rawO = localStorage.getItem(LOCAL_ORDERS_KEY);
      const orders: Order[] = rawO ? JSON.parse(rawO) : [];

      this.publish({
        type: "SEND_FULL_STATE",
        payload: { profiles, ads, orders },
        senderId: this.clientId,
        timestamp: Date.now(),
      }, STATE_TOPIC);
    } catch {}
  }

  public requestFullState() {
    this.publish({
      type: "REQUEST_FULL_STATE",
      senderId: this.clientId,
      timestamp: Date.now(),
    }, STATE_TOPIC);
  }

  public broadcastProfileUpsert(profile: Profile) {
    this.publish({
      type: "PROFILE_UPSERT",
      payload: profile,
      senderId: this.clientId,
      timestamp: Date.now(),
    });
    this.notifyLocal("profiles");
  }

  public broadcastProfileDelete(id: string, email?: string) {
    this.publish({
      type: "PROFILE_DELETE",
      payload: { id, email },
      senderId: this.clientId,
      timestamp: Date.now(),
    });
    this.notifyLocal("profiles");
  }

  public broadcastAdUpsert(ad: Ad) {
    this.publish({
      type: "AD_UPSERT",
      payload: ad,
      senderId: this.clientId,
      timestamp: Date.now(),
    });
    this.notifyLocal("ads");
  }

  public broadcastAdDelete(id: string) {
    this.publish({
      type: "AD_DELETE",
      payload: { id },
      senderId: this.clientId,
      timestamp: Date.now(),
    });
    this.notifyLocal("ads");
  }

  public broadcastOrderUpsert(order: Order) {
    this.publish({
      type: "ORDER_UPSERT",
      payload: order,
      senderId: this.clientId,
      timestamp: Date.now(),
    });
    this.notifyLocal("orders");
  }

  public broadcastOrderDelete(id: string) {
    this.publish({
      type: "ORDER_DELETE",
      payload: { id },
      senderId: this.clientId,
      timestamp: Date.now(),
    });
    this.notifyLocal("orders");
  }

  private publish(msg: SyncMessage, targetTopic = SYNC_TOPIC) {
    if (!this.client || !this.client.connected) {
      this.connect();
    }
    try {
      const payload = JSON.stringify(msg);
      this.client?.publish(targetTopic, payload, { qos: 0 });
    } catch (err) {
      console.warn("[SHOP7 Realtime Engine] Falha ao publicar evento:", err);
    }
  }

  private notifyLocal(type: "ads" | "profiles" | "orders" | "all") {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(new CustomEvent("shop7_sync_event", { detail: { type } }));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("shop7_sync_bus");
        bc.postMessage({ type });
        bc.close();
      }
    } catch {}
    this.notifyListeners(type);
  }

  private notifyListeners(type: "ads" | "profiles" | "orders" | "all") {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(type);
      } catch (err) {
        console.error("Erro no listener de sincronização:", err);
      }
    }
  }

  public subscribe(listener: (type: "ads" | "profiles" | "orders" | "all") => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const realtimeSync = new RealtimeSyncEngine();

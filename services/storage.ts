
/**
 * ENTERPRISE STORAGE LAYER (Redis + DB Abstraction)
 * 
 * ARCHITECTURE DECISION:
 * - Hot State (Rate Limits, Locks, Active Execution Pointer) -> Redis
 * - Cold State (Audit Logs, Completed Workflows) -> Postgres/Firestore
 * 
 * ADAPTER PATTERN:
 * This class abstracts the storage mechanism. In production, swap the methods
 * to call `redis.get()`, `redis.set()`. In this demo, it uses an in-memory Map.
 */

interface KVStore {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    incr(key: string, ttlSeconds?: number): Promise<number>;
    exists(key: string): Promise<boolean>;
}

class InMemoryRedis implements KVStore {
    private store: Map<string, { value: string; expiry: number | null }> = new Map();

    async get(key: string): Promise<string | null> {
        const item = this.store.get(key);
        if (!item) return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
        this.store.set(key, { value, expiry });
    }

    async incr(key: string, ttlSeconds?: number): Promise<number> {
        const current = await this.get(key);
        const newVal = (parseInt(current || '0') + 1);
        
        let expiry = this.store.get(key)?.expiry || null;
        if (ttlSeconds) {
            expiry = Date.now() + (ttlSeconds * 1000);
        } else if (!current && ttlSeconds) {
            expiry = Date.now() + (ttlSeconds * 1000);
        }

        this.store.set(key, { value: newVal.toString(), expiry });
        return newVal;
    }

    async exists(key: string): Promise<boolean> {
        return (await this.get(key)) !== null;
    }
}

export const db = new InMemoryRedis();

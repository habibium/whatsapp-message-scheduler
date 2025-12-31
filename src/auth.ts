import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataSet,
  SignalDataTypeMap
} from "baileys";
import { BufferJSON, initAuthCreds, proto } from "baileys";

/**
 * A more efficient auth state implementation that stores all data in a single JSON file
 * with in-memory caching. This is much more efficient than useMultiFileAuthState
 * which reads/writes many individual files.
 *
 * Features:
 * - Single file storage (reduces disk I/O)
 * - In-memory caching (fast reads)
 * - Debounced writes (batches multiple updates)
 */

type AuthData = {
  creds: AuthenticationCreds;
  keys: {
    [category: string]: {
      [id: string]: unknown;
    };
  };
};

const DEFAULT_DEBOUNCE_MS = 500;

export async function useSingleFileAuthState(
  filePath: string,
  options?: { debounceMs?: number }
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  let writeTimeout: NodeJS.Timeout | null = null;
  let pendingWrite = false;
  let isWriting = false;

  // In-memory cache of all auth data
  let authData: AuthData = {
    creds: initAuthCreds(),
    keys: {}
  };

  // Load existing data from file
  const loadData = async (): Promise<void> => {
    try {
      const content = await readFile(filePath, { encoding: "utf-8" });
      const parsed = JSON.parse(content, BufferJSON.reviver) as AuthData;
      authData = parsed;
    } catch {
      // File doesn't exist or is invalid, use default
      authData = {
        creds: initAuthCreds(),
        keys: {}
      };
    }
  };

  // Save data to file
  const saveData = async (): Promise<void> => {
    if (isWriting) return;
    isWriting = true;
    try {
      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(authData, BufferJSON.replacer));
    } catch (error) {
      console.error("Failed to save auth state:", error);
      throw error;
    } finally {
      isWriting = false;
    }
  };

  // Debounced save - batches multiple writes together
  const debouncedSave = (): void => {
    pendingWrite = true;
    if (writeTimeout) {
      clearTimeout(writeTimeout);
    }
    writeTimeout = setTimeout(async () => {
      if (pendingWrite) {
        await saveData();
        pendingWrite = false;
      }
    }, debounceMs);
  };

  // Force save (for graceful shutdown)
  const forceSave = async (): Promise<void> => {
    if (writeTimeout) {
      clearTimeout(writeTimeout);
      writeTimeout = null;
    }
    if (pendingWrite) {
      await saveData();
      pendingWrite = false;
    }
  };

  // Load initial data
  await loadData();

  // Handle graceful shutdown
  const cleanup = async () => {
    await forceSave();
  };

  process.on("beforeExit", cleanup);
  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await cleanup();
    process.exit(0);
  });

  return {
    state: {
      creds: authData.creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(
          type: T,
          ids: string[]
        ): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
          const data: { [id: string]: SignalDataTypeMap[T] } = {};

          for (const id of ids) {
            const storedValue = authData.keys[type]?.[id];
            if (storedValue === undefined) continue;

            let value = storedValue;

            // Handle special case for app-state-sync-key
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(
                value as Record<string, unknown>
              );
            }

            data[id] = value as SignalDataTypeMap[T];
          }

          return data;
        },

        set: async (data: SignalDataSet): Promise<void> => {
          for (const category in data) {
            const categoryKey = category as keyof SignalDataSet;
            const categoryData = data[categoryKey];
            if (!categoryData) continue;

            if (!authData.keys[categoryKey]) {
              authData.keys[categoryKey] = {};
            }

            for (const id in categoryData) {
              const value = categoryData[id];
              if (value !== null && value !== undefined) {
                authData.keys[categoryKey][id] = value;
              } else {
                delete authData.keys[categoryKey][id];
              }
            }
          }

          debouncedSave();
        }
      }
    },
    saveCreds: async (): Promise<void> => {
      // Update creds in our cache
      authData.creds = { ...authData.creds };
      debouncedSave();
    }
  };
}

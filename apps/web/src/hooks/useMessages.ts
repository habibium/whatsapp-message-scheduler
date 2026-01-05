import { useCallback, useEffect, useState } from "react";
import { api, type ScheduledMessage } from "../lib/api";

export function useMessages() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.messages.list();
    if (result.success) {
      setMessages(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async (
    data: Omit<ScheduledMessage, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    const result = await api.messages.create(data);
    if (result.success) {
      setMessages((prev) => [result.data, ...prev]);
      return null;
    }
    return result.error;
  };

  const update = async (id: string, data: Partial<ScheduledMessage>) => {
    const result = await api.messages.update(id, data);
    if (result.success) {
      setMessages((prev) => prev.map((m) => (m.id === id ? result.data : m)));
      return null;
    }
    return result.error;
  };

  const remove = async (id: string) => {
    const result = await api.messages.delete(id);
    if (result.success) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      return null;
    }
    return result.error;
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    return update(id, { enabled });
  };

  return {
    messages,
    loading,
    error,
    create,
    update,
    remove,
    toggleEnabled,
    refresh: fetch
  };
}

export function useMessage(id: string | undefined) {
  const [message, setMessage] = useState<ScheduledMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setMessage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.messages.get(id).then((result) => {
      if (result.success) {
        setMessage(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, [id]);

  return { message, loading, error };
}

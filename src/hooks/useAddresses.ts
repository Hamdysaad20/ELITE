import { useState, useEffect, useCallback } from "react";
import type { Address } from "@/types";
import { authFetch } from "@/lib/auth/apiClient";

interface UseAddressesReturn {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  defaultAddress: Address | null;
  createAddress: (data: Partial<Address>) => Promise<Address | null>;
  updateAddress: (
    id: string,
    data: Partial<Address>,
  ) => Promise<Address | null>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAddresses(): UseAddressesReturn {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessageFromResponse = async (res: Response) => {
    try {
      const json = await res.json();
      if (
        json?.errors &&
        Array.isArray(json.errors) &&
        json.errors.length > 0
      ) {
        // API returns { error: "Validation failed", errors: [{field,message}, ...] }
        const first = json.errors[0];
        if (first?.field && first?.message)
          return `${first.field}: ${first.message}`;
        if (first?.message) return String(first.message);
      }
      if (json?.error) return String(json.error);
      if (json?.message) return String(json.message);
    } catch {
      // ignore JSON parse errors
    }
    return `Request failed (${res.status})`;
  };

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch("/api/addresses", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch addresses");
      }

      const json = await res.json();
      if (json.success && json.data) {
        setAddresses(json.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching addresses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = async (
    data: Partial<Address>,
  ): Promise<Address | null> => {
    try {
      const res = await authFetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessageFromResponse(res));
      }

      const json = await res.json();
      if (json.success && json.data) {
        await fetchAddresses(); // Refetch to update list
        return json.data;
      }
      return null;
    } catch (err) {
      console.error("Error creating address:", err);
      throw err;
    }
  };

  const updateAddress = async (
    id: string,
    data: Partial<Address>,
  ): Promise<Address | null> => {
    try {
      const res = await authFetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessageFromResponse(res));
      }

      const json = await res.json();
      if (json.success && json.data) {
        await fetchAddresses(); // Refetch to update list
        return json.data;
      }
      return null;
    } catch (err) {
      console.error("Error updating address:", err);
      throw err;
    }
  };

  const deleteAddress = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/addresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await getErrorMessageFromResponse(res));
      }

      await fetchAddresses(); // Refetch to update list
      return true;
    } catch (err) {
      console.error("Error deleting address:", err);
      throw err;
    }
  };

  const setDefaultAddress = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isDefault: true }),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessageFromResponse(res));
      }

      await fetchAddresses(); // Refetch to update list
      return true;
    } catch (err) {
      console.error("Error setting default address:", err);
      throw err;
    }
  };

  const defaultAddress = addresses.find((addr) => addr.isDefault) || null;

  return {
    addresses,
    loading,
    error,
    defaultAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refetch: fetchAddresses,
  };
}

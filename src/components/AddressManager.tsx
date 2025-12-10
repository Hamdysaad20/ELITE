"use client";

import React, { useState } from "react";
import { useAddresses } from "@/hooks/useAddresses";
import type { Address } from "@/types";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Home,
  Building,
  Briefcase,
  Loader2,
} from "lucide-react";

interface AddressManagerProps {
  onSelectAddress?: (address: Address) => void;
  selectedAddressId?: string;
  compact?: boolean;
}

export default function AddressManager({
  onSelectAddress,
  selectedAddressId,
  compact = false,
}: AddressManagerProps) {
  const {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddresses();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({
    label: "Home",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Egypt",
    phone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const getLabelIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes("home")) return <Home className="w-4 h-4" />;
    if (lower.includes("work") || lower.includes("office"))
      return <Briefcase className="w-4 h-4" />;
    return <Building className="w-4 h-4" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        await updateAddress(editingId, formData);
        setEditingId(null);
      } else {
        await createAddress(formData);
        setIsAdding(false);
      }
      // Reset form
      setFormData({
        label: "Home",
        street: "",
        apartment: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Egypt",
        phone: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error saving address:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      label: address.label,
      street: address.street,
      apartment: address.apartment || "",
      city: address.city,
      state: address.state || "",
      zipCode: address.zipCode || "",
      country: address.country,
      phone: address.phone || "",
      notes: address.notes || "",
    });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteAddress(id);
      } catch (err) {
        console.error("Error deleting address:", err);
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
    } catch (err) {
      console.error("Error setting default:", err);
    }
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      label: "Home",
      street: "",
      apartment: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Egypt",
      phone: "",
      notes: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-elite-burgundy" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-red-700">
        <p className="font-cabin">Error loading addresses: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Address List */}
      <div className="space-y-3">
        {addresses.map((address) => {
          const isEditing = editingId === address.id;
          const isSelected = selectedAddressId === address.id;

          if (isEditing) {
            return (
              <form
                key={address.id}
                onSubmit={handleSubmit}
                className="bg-elite-cream rounded-2xl p-5 border-2 border-elite-burgundy"
              >
                <AddressForm
                  formData={formData}
                  setFormData={setFormData}
                  submitting={submitting}
                  onCancel={cancelForm}
                />
              </form>
            );
          }

          return (
            <div
              key={address.id}
              onClick={() => onSelectAddress?.(address)}
              className={`bg-elite-cream rounded-2xl p-5 border-2 transition-all ${
                isSelected
                  ? "border-elite-burgundy bg-elite-burgundy/5"
                  : "border-elite-burgundy/20 hover:border-elite-burgundy/40"
              } ${onSelectAddress ? "cursor-pointer" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-elite-burgundy text-elite-cream flex items-center justify-center flex-shrink-0">
                    {getLabelIcon(address.label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-calistoga text-elite-black text-lg">
                        {address.label}
                      </h4>
                      {address.isDefault && (
                        <span className="bg-elite-burgundy text-elite-cream px-2 py-0.5 rounded-full text-xs font-cabin font-semibold">
                          Default
                        </span>
                      )}
                      {isSelected && onSelectAddress && (
                        <Check className="w-5 h-5 text-elite-burgundy ml-auto" />
                      )}
                    </div>
                    <p className="font-cabin text-elite-black/80 text-sm">
                      {address.street}
                      {address.apartment && `, ${address.apartment}`}
                    </p>
                    <p className="font-cabin text-elite-black/60 text-sm">
                      {address.city}
                      {address.state && `, ${address.state}`}
                      {address.zipCode && ` ${address.zipCode}`}
                    </p>
                    {address.phone && (
                      <p className="font-cabin text-elite-black/60 text-sm mt-1">
                        📞 {address.phone}
                      </p>
                    )}
                    {address.notes && (
                      <p className="font-cabin text-elite-black/60 text-sm mt-1 italic">
                        {address.notes}
                      </p>
                    )}
                  </div>
                </div>

                {!onSelectAddress && (
                  <div className="flex items-center gap-2">
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address.id)}
                        className="p-2 rounded-lg hover:bg-elite-burgundy/10 text-elite-burgundy transition-colors"
                        title="Set as default"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(address)}
                      className="p-2 rounded-lg hover:bg-elite-burgundy/10 text-elite-burgundy transition-colors"
                      title="Edit address"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Address Form */}
      {isAdding ? (
        <form
          onSubmit={handleSubmit}
          className="bg-elite-cream rounded-2xl p-5 border-2 border-elite-burgundy"
        >
          <AddressForm
            formData={formData}
            setFormData={setFormData}
            submitting={submitting}
            onCancel={cancelForm}
          />
        </form>
      ) : (
        !onSelectAddress && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full bg-elite-cream border-2 border-dashed border-elite-burgundy/30 hover:border-elite-burgundy rounded-2xl p-5 flex items-center justify-center gap-2 text-elite-burgundy font-cabin font-semibold transition-all hover:bg-elite-burgundy/5"
          >
            <Plus className="w-5 h-5" />
            Add New Address
          </button>
        )
      )}
    </div>
  );
}

interface AddressFormProps {
  formData: Partial<Address>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Address>>>;
  submitting: boolean;
  onCancel: () => void;
}

function AddressForm({
  formData,
  setFormData,
  submitting,
  onCancel,
}: AddressFormProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-calistoga text-elite-black text-lg mb-4">
        {formData.label ? "Edit Address" : "New Address"}
      </h4>

      {/* Label Selection */}
      <div>
        <label className="block font-cabin font-semibold text-elite-black mb-2">
          Address Label
        </label>
        <div className="flex gap-2">
          {["Home", "Work", "Office", "Other"].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFormData({ ...formData, label })}
              className={`px-4 py-2 rounded-lg font-cabin font-semibold transition-all ${
                formData.label === label
                  ? "bg-elite-burgundy text-elite-cream"
                  : "bg-white text-elite-black border-2 border-elite-burgundy/20 hover:border-elite-burgundy/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Street Address */}
      <div>
        <label className="block font-cabin font-semibold text-elite-black mb-2">
          Street Address *
        </label>
        <input
          type="text"
          required
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          placeholder="123 Main Street"
          className="w-full px-4 py-3 rounded-lg border-2 border-elite-burgundy/20 focus:border-elite-burgundy focus:outline-none font-cabin"
        />
      </div>

      {/* Apartment/Unit */}
      <div>
        <label className="block font-cabin font-semibold text-elite-black mb-2">
          Apartment, Suite, Unit (Optional)
        </label>
        <input
          type="text"
          value={formData.apartment}
          onChange={(e) =>
            setFormData({ ...formData, apartment: e.target.value })
          }
          placeholder="Apt 4B"
          className="w-full px-4 py-3 rounded-lg border-2 border-elite-burgundy/20 focus:border-elite-burgundy focus:outline-none font-cabin"
        />
      </div>

      {/* City & State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-cabin font-semibold text-elite-black mb-2">
            City *
          </label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Cairo"
            className="w-full px-4 py-3 rounded-lg border-2 border-elite-burgundy/20 focus:border-elite-burgundy focus:outline-none font-cabin"
          />
        </div>
        <div>
          <label className="block font-cabin font-semibold text-elite-black mb-2">
            State/Province
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="Cairo Governorate"
            className="w-full px-4 py-3 rounded-lg border-2 border-elite-burgundy/20 focus:border-elite-burgundy focus:outline-none font-cabin"
          />
        </div>
      </div>

      {/* Zip Code & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-cabin font-semibold text-elite-black mb-2">
            Zip/Postal Code
          </label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) =>
              setFormData({ ...formData, zipCode: e.target.value })
            }
            placeholder="12345"
            className="w-full px-4 py-3 rounded-lg border-2 border-elite-burgundy/20 focus:border-elite-burgundy focus:outline-none font-cabin"
          />
        </div>
        <div>
          <label className="block font-cabin font-semibold text-elite-black mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+20 123 456 7890"
            className="w-full px-4 py-3 rounded-lg border-2 border-elite-burgundy/20 focus:border-elite-burgundy focus:outline-none font-cabin"
          />
        </div>
      </div>

      {/* Delivery Notes */}
      <div>
        <label className="block font-cabin font-semibold text-elite-black mb-2">
          Delivery Instructions (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="e.g., Ring doorbell, leave at door, etc."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border-2 border-elite-burgundy/20 focus:border-elite-burgundy focus:outline-none font-cabin resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Address
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-6 py-3 rounded-full border-2 border-elite-burgundy text-elite-burgundy font-cabin font-semibold hover:bg-elite-burgundy/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useAddresses } from "@/hooks/useAddresses";
import type { Address } from "@/types";
import {
  validateAddressField,
  validateAddress,
  ADDRESS_VALIDATION,
} from "@/lib/validators/addressValidator";
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
  allowAddInSelectMode?: boolean;
  onAddressCreated?: (address: Address) => void;
}

export default function AddressManager({
  onSelectAddress,
  selectedAddressId,
  compact = false,
  allowAddInSelectMode = false,
  onAddressCreated,
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getLabelIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes("home")) return <Home className="w-4 h-4" />;
    if (lower.includes("work") || lower.includes("office"))
      return <Briefcase className="w-4 h-4" />;
    return <Building className="w-4 h-4" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields using shared validator
    const validation = validateAddress(formData);
    if (!validation.isValid) {
      // Set errors from validation
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((err: { field: string; message: string }) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    setSubmitting(true);

    try {
      // Normalize optional fields so empty strings don't get treated as "provided" values
      // by backend validation (and to avoid saving empty strings in DB).
      const payload: Partial<Address> = {
        ...formData,
        apartment: formData.apartment?.trim() ? formData.apartment : undefined,
        state: formData.state?.trim() ? formData.state : undefined,
        zipCode: formData.zipCode?.trim() ? formData.zipCode : undefined,
        phone: formData.phone?.trim() ? formData.phone : undefined,
        notes: formData.notes?.trim() ? formData.notes : undefined,
      };

      if (editingId) {
        await updateAddress(editingId, payload);
        setEditingId(null);
      } else {
        const created = await createAddress(payload);
        if (created) {
          onAddressCreated?.(created);
          onSelectAddress?.(created);
        }
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
      // Show error message if it's a duplicate address error
      if (err instanceof Error && err.message.includes("already exists")) {
        alert(err.message);
      }
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
    <div className="space-y-4 pb-6">
      {/* Address List */}
      <div className="space-y-4">
        {addresses.map((address) => {
          const isEditing = editingId === address.id;
          const isSelected = selectedAddressId === address.id;

          if (isEditing) {
            return (
              <form
                key={address.id}
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-elite-burgundy shadow-lg"
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
              className={`bg-white rounded-3xl p-5 sm:p-6 border-2 transition-all shadow-md hover:shadow-lg ${
                isSelected
                  ? "border-elite-burgundy bg-elite-burgundy/5 shadow-elite-burgundy/20"
                  : "border-elite-burgundy/20 hover:border-elite-burgundy/40"
              } ${onSelectAddress ? "cursor-pointer" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-elite-burgundy text-elite-cream flex items-center justify-center flex-shrink-0 shadow-md">
                    {getLabelIcon(address.label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-calistoga text-elite-black text-lg">
                        {address.label}
                      </h4>
                      {address.isDefault && (
                        <span className="bg-elite-burgundy text-elite-cream px-3 py-1 rounded-full text-xs font-cabin font-bold shadow-sm">
                          Default
                        </span>
                      )}
                      {onSelectAddress && (
                        <div
                          className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center transition-opacity ${
                            isSelected
                              ? "bg-elite-burgundy opacity-100"
                              : "bg-elite-burgundy opacity-0"
                          }`}
                        >
                          <Check className="w-4 h-4 text-elite-cream" />
                        </div>
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
                        className="p-2.5 rounded-xl hover:bg-elite-burgundy/10 text-elite-burgundy transition-all hover:shadow-md"
                        title="Set as default"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(address)}
                      className="p-2.5 rounded-xl hover:bg-elite-burgundy/10 text-elite-burgundy transition-all hover:shadow-md"
                      title="Edit address"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      className="p-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-all hover:shadow-md"
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
          className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-elite-burgundy shadow-lg"
        >
          <AddressForm
            formData={formData}
            setFormData={setFormData}
            submitting={submitting}
            onCancel={cancelForm}
          />
        </form>
      ) : (
        (!onSelectAddress || allowAddInSelectMode) && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full bg-white border-2 border-dashed border-elite-burgundy/30 hover:border-elite-burgundy rounded-3xl p-5 sm:p-6 flex items-center justify-center gap-3 text-elite-burgundy font-cabin font-bold text-lg transition-all hover:bg-elite-burgundy/5 hover:shadow-lg group"
          >
            <div className="w-10 h-10 rounded-full bg-elite-burgundy/10 flex items-center justify-center group-hover:bg-elite-burgundy/20 transition-colors">
              <Plus className="w-6 h-6" />
            </div>
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use shared validation function
  const validateField = (name: string, value: string | null | undefined) => {
    const validation = validateAddressField(name, value);
    const newErrors = { ...errors };

    if (!validation.isValid && validation.message) {
      newErrors[name] = validation.message;
    } else {
      delete newErrors[name];
    }

    setErrors(newErrors);
  };

  const handleFieldChange = (name: string, value: string) => {
    // For city field, prevent numeric input in real-time
    if (name === "city") {
      // Remove any numeric characters
      const cleanedValue = value.replace(/\d/g, "");
      if (cleanedValue !== value) {
        // If numbers were removed, update with cleaned value
        setFormData({ ...formData, [name]: cleanedValue });
        validateField(name, cleanedValue);
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  return (
    <div className="space-y-5">
      <h4 className="font-calistoga text-elite-black text-lg mb-4">
        {formData.label ? "Edit Address" : "New Address"}
      </h4>

      {/* Label Selection */}
      <div>
        <label className="block font-cabin font-bold text-elite-black mb-3 text-sm">
          Address Label
        </label>
        <div className="flex flex-wrap gap-2">
          {["Home", "Work", "Office", "Other"].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFormData({ ...formData, label })}
              className={`px-5 py-2.5 rounded-full font-cabin font-bold transition-all text-sm ${
                formData.label === label
                  ? "bg-elite-burgundy text-elite-cream shadow-md shadow-elite-burgundy/30"
                  : "bg-white text-elite-black border-2 border-elite-burgundy/30 hover:border-elite-burgundy hover:shadow-md"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Street Address */}
      <div>
        <label className="block font-cabin font-bold text-elite-black mb-3 text-sm">
          Street Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={ADDRESS_VALIDATION.STREET_MAX_LENGTH}
          value={formData.street}
          onChange={(e) => handleFieldChange("street", e.target.value)}
          onBlur={(e) => validateField("street", e.target.value)}
          placeholder="123 Main Street"
          className={`w-full px-4 py-3.5 rounded-xl border-2 focus:ring-2 focus:outline-none font-cabin transition-all ${
            errors.street
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-elite-burgundy/20 focus:border-elite-burgundy focus:ring-elite-burgundy/20"
          }`}
        />
        {errors.street && (
          <p className="mt-1 text-sm text-red-600 font-cabin">
            {errors.street}
          </p>
        )}
      </div>

      {/* Apartment/Unit */}
      <div>
        <label className="block font-cabin font-bold text-elite-black mb-3 text-sm">
          Apartment, Suite, Unit{" "}
          <span className="text-elite-black/40">(Optional)</span>
        </label>
        <input
          type="text"
          maxLength={ADDRESS_VALIDATION.APARTMENT_MAX_LENGTH}
          value={formData.apartment}
          onChange={(e) => handleFieldChange("apartment", e.target.value)}
          onBlur={(e) => validateField("apartment", e.target.value)}
          placeholder="Apt 4B"
          className={`w-full px-4 py-3.5 rounded-xl border-2 focus:ring-2 focus:outline-none font-cabin transition-all ${
            errors.apartment
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-elite-burgundy/20 focus:border-elite-burgundy focus:ring-elite-burgundy/20"
          }`}
        />
        {errors.apartment && (
          <p className="mt-1 text-sm text-red-600 font-cabin">
            {errors.apartment}
          </p>
        )}
      </div>

      {/* City & State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-cabin font-bold text-elite-black mb-3 text-sm">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={ADDRESS_VALIDATION.CITY_MAX_LENGTH}
            value={formData.city}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            onBlur={(e) => validateField("city", e.target.value)}
            placeholder="Cairo"
            className={`w-full px-4 py-3.5 rounded-xl border-2 focus:ring-2 focus:outline-none font-cabin transition-all ${
              errors.city
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-elite-burgundy/20 focus:border-elite-burgundy focus:ring-elite-burgundy/20"
            }`}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600 font-cabin">
              {errors.city}
            </p>
          )}
        </div>
        <div>
          <label className="block font-cabin font-bold text-elite-black mb-3 text-sm">
            State/Province
          </label>
          <input
            type="text"
            maxLength={ADDRESS_VALIDATION.STATE_MAX_LENGTH}
            value={formData.state}
            onChange={(e) => handleFieldChange("state", e.target.value)}
            onBlur={(e) => validateField("state", e.target.value)}
            placeholder="Cairo Governorate"
            className={`w-full px-4 py-3.5 rounded-xl border-2 focus:ring-2 focus:outline-none font-cabin transition-all ${
              errors.state
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-elite-burgundy/20 focus:border-elite-burgundy focus:ring-elite-burgundy/20"
            }`}
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-600 font-cabin">
              {errors.state}
            </p>
          )}
        </div>
      </div>

      {/* Zip Code & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-cabin font-bold text-elite-black mb-3 text-sm">
            Zip/Postal Code
          </label>
          <input
            type="text"
            maxLength={ADDRESS_VALIDATION.ZIP_CODE_MAX_LENGTH}
            value={formData.zipCode}
            onChange={(e) => handleFieldChange("zipCode", e.target.value)}
            onBlur={(e) => validateField("zipCode", e.target.value)}
            placeholder="12345"
            className={`w-full px-4 py-3.5 rounded-xl border-2 focus:ring-2 focus:outline-none font-cabin transition-all ${
              errors.zipCode
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-elite-burgundy/20 focus:border-elite-burgundy focus:ring-elite-burgundy/20"
            }`}
          />
          {errors.zipCode && (
            <p className="mt-1 text-sm text-red-600 font-cabin">
              {errors.zipCode}
            </p>
          )}
        </div>
        <div>
          <label className="block font-cabin font-bold text-elite-black mb-3 text-sm">
            Phone Number
          </label>
          <input
            type="tel"
            maxLength={ADDRESS_VALIDATION.PHONE_MAX_LENGTH}
            value={formData.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            onBlur={(e) => validateField("phone", e.target.value)}
            placeholder="+20 123 456 7890"
            className={`w-full px-4 py-3.5 rounded-xl border-2 focus:ring-2 focus:outline-none font-cabin transition-all ${
              errors.phone
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-elite-burgundy/20 focus:border-elite-burgundy focus:ring-elite-burgundy/20"
            }`}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 font-cabin">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Delivery Notes */}
      <div>
        <label className="block font-cabin font-bold text-elite-black mb-3 text-sm">
          Delivery Instructions{" "}
          <span className="text-elite-black/40">(Optional)</span>
        </label>
        <textarea
          maxLength={ADDRESS_VALIDATION.NOTES_MAX_LENGTH}
          value={formData.notes}
          onChange={(e) => handleFieldChange("notes", e.target.value)}
          onBlur={(e) => validateField("notes", e.target.value)}
          placeholder="e.g., Ring doorbell, leave at door, etc."
          rows={3}
          className={`w-full px-4 py-3.5 rounded-xl border-2 focus:ring-2 focus:outline-none font-cabin resize-none transition-all ${
            errors.notes
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-elite-burgundy/20 focus:border-elite-burgundy focus:ring-elite-burgundy/20"
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.notes && (
            <p className="text-sm text-red-600 font-cabin">{errors.notes}</p>
          )}
          <p className="text-xs text-elite-black/40 font-cabin ml-auto">
            {formData.notes?.length || 0}/{ADDRESS_VALIDATION.NOTES_MAX_LENGTH}{" "}
            characters
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-elite-burgundy text-elite-cream px-6 py-4 rounded-2xl font-cabin font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-elite-burgundy/30"
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
          className="px-6 py-4 rounded-2xl border-2 border-elite-burgundy text-elite-burgundy font-cabin font-bold text-lg hover:bg-elite-burgundy/10 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

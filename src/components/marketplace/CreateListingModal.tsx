import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2, Loader2 } from "lucide-react";
import type { ApiMarketplaceListing, ApiMediaItem } from "../../services/marketplaceApi";
import { listingMarketplaceApi } from "../../services/marketplaceApi";

const CATEGORIES = [
  "Apparel & accessories",
  "Autos & vehicles",
  "Baby & children's products",
  "Beauty products & services",
  "Computers & peripherals",
  "Consumers & Electronics",
  "Dating Services",
  "Events & entertainment",
  "Financial service",
  "Gifts & Occasions",
  "Home & Garden",
  "Home & repair services",
  "Photography & video",
  "Tailoring & fashion",
  "Services",
  "Other",
];

const SERVICE_UNITS = [
  "per session",
  "per hour",
  "per day",
  "per outfit",
  "starting from",
];

const SERVICE_PLACES = [
  { id: "studio", label: "At my studio" },
  { id: "client_site", label: "At the client's location" },
  { id: "both", label: "Studio or client location" },
  { id: "remote", label: "Online / remote" },
] as const;

const MAX_MEDIA = 8;

export type ListingKind = "goods" | "service";

export interface CreateListingPayload {
  title: string;
  description: string;
  category: string;
  listingKind: ListingKind;
  priceNaira: number;
  quantityTracked: boolean;
  stockQuantity: number | null;
  quantityNote: string | null;
  unit: string | null;
  durationNote: string | null;
  serviceLocation: string | null;
  serviceArea: string | null;
  availabilityNote: string | null;
  media: ApiMediaItem[];
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  sellerContactName: string;
  sellerContactPhone: string;
  sellerContactEmail: string;
  sellerContactWhatsapp: string;
}

export interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  initialListing?: ApiMarketplaceListing | null;
  onSubmit: (payload: CreateListingPayload) => Promise<{ success: boolean; message?: string }>;
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialListing,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Home & Garden");
  const [listingKind, setListingKind] = useState<ListingKind>("goods");
  const [priceNaira, setPriceNaira] = useState("");
  const [quantityTracked, setQuantityTracked] = useState(true);
  const [stockQuantity, setStockQuantity] = useState("");
  const [quantityNote, setQuantityNote] = useState("");
  const [unit, setUnit] = useState("");
  const [durationNote, setDurationNote] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [sellerContactName, setSellerContactName] = useState("");
  const [sellerContactPhone, setSellerContactPhone] = useState("");
  const [sellerContactEmail, setSellerContactEmail] = useState("");
  const [sellerContactWhatsapp, setSellerContactWhatsapp] = useState("");
  const [mediaItems, setMediaItems] = useState<ApiMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isService = listingKind === "service";

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (initialListing) {
      const kind = initialListing.listing_kind === "service" ? "service" : "goods";
      setTitle(initialListing.title);
      setDescription(initialListing.description || "");
      setCategory(initialListing.category || "Other");
      setListingKind(kind);
      setPriceNaira(String(initialListing.price ?? ""));
      setQuantityTracked(kind === "goods" && !!initialListing.quantity_tracked);
      setStockQuantity(
        kind === "goods" && initialListing.quantity_tracked ? String(initialListing.stock ?? "") : ""
      );
      setQuantityNote(initialListing.quantity_note || "");
      setUnit(initialListing.unit || "");
      setDurationNote(initialListing.duration_note || "");
      setServiceLocation(initialListing.service_location || "");
      setServiceArea(initialListing.service_area || "");
      setAvailabilityNote(initialListing.availability_note || initialListing.quantity_note || "");
      setBankName(initialListing.bank?.bank_name || "");
      setBankAccountNumber(initialListing.bank?.bank_account_number || "");
      setBankAccountName(initialListing.bank?.bank_account_name || "");
      setSellerContactName(initialListing.contact?.name || "");
      setSellerContactPhone(initialListing.contact?.phone || "");
      setSellerContactEmail(initialListing.contact?.email || "");
      setSellerContactWhatsapp(initialListing.contact?.whatsapp || "");
      setMediaItems(
        (initialListing.media || []).map((m) => ({
          type: m.type === "video" ? "video" : "image",
          url: m.url,
        }))
      );
    } else {
      setTitle("");
      setDescription("");
      setCategory(categories.find((c) => c !== "All") || "Home & Garden");
      setListingKind("goods");
      setPriceNaira("");
      setQuantityTracked(true);
      setStockQuantity("");
      setQuantityNote("");
      setUnit("");
      setDurationNote("");
      setServiceLocation("");
      setServiceArea("");
      setAvailabilityNote("");
      setBankName("");
      setBankAccountNumber("");
      setBankAccountName("");
      setSellerContactName("");
      setSellerContactPhone("");
      setSellerContactEmail("");
      setSellerContactWhatsapp("");
      setMediaItems([]);
    }
  }, [isOpen, initialListing, categories]);

  if (!isOpen) return null;

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const room = MAX_MEDIA - mediaItems.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_MEDIA} images or videos.`);
      e.target.value = "";
      return;
    }
    setError(null);
    const list = Array.from(files).slice(0, room);
    setUploading(true);
    for (const file of list) {
      const res = await listingMarketplaceApi.uploadListingMedia(file);
      if (!res.success || !res.data?.url) {
        setError(res.message || "Upload failed. Try a smaller file or check your connection.");
        break;
      }
      const type = res.data.type === "video" ? "video" : "image";
      setMediaItems((prev) => [...prev, { type, url: res.data!.url }]);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKindChange = (next: ListingKind) => {
    setListingKind(next);
    setUnit("");
    if (next === "service") {
      setQuantityTracked(false);
      setStockQuantity("");
    } else {
      setQuantityTracked(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const price = Number(priceNaira.replace(/,/g, ""));
    if (!title.trim()) {
      setError(isService ? "Service name is required." : "Title is required.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price in Naira.");
      return;
    }
    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
      setError("Bank name, account number, and account name are required.");
      return;
    }
    if (!sellerContactPhone.trim() && !sellerContactEmail.trim()) {
      setError("Add at least a contact phone or email for buyers.");
      return;
    }
    let stock: number | null = null;
    if (!isService && quantityTracked) {
      const s = Number(stockQuantity);
      if (!Number.isFinite(s) || s < 1) {
        setError("Enter how many units you have in stock.");
        return;
      }
      stock = Math.floor(s);
    }
    setSaving(true);
    const res = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      listingKind,
      priceNaira: price,
      quantityTracked: isService ? false : quantityTracked,
      stockQuantity: stock,
      quantityNote: isService
        ? availabilityNote.trim() || null
        : quantityTracked
          ? null
          : quantityNote.trim() || null,
      unit: unit.trim() || null,
      durationNote: isService ? durationNote.trim() || null : null,
      serviceLocation: isService ? serviceLocation || null : null,
      serviceArea: isService ? serviceArea.trim() || null : null,
      availabilityNote: isService ? availabilityNote.trim() || null : null,
      media: mediaItems.slice(0, MAX_MEDIA),
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountName: bankAccountName.trim(),
      sellerContactName: sellerContactName.trim(),
      sellerContactPhone: sellerContactPhone.trim(),
      sellerContactEmail: sellerContactEmail.trim(),
      sellerContactWhatsapp: sellerContactWhatsapp.trim(),
    });
    setSaving(false);
    if (!res.success) {
      setError(res.message || "Could not save.");
      return;
    }
    onClose();
  };

  const catOptions = categories.filter((c) => c !== "All");
  const mergedCats = [...new Set([...CATEGORIES, ...catOptions])];

  return (
    <div className="marketplace-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="marketplace-modal marketplace-modal--wide marketplace-modal--create"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-listing-title"
      >
        <div className="marketplace-modal__header">
          <h2 id="create-listing-title">
            {initialListing
              ? isService
                ? "Edit service"
                : "Edit offer"
              : isService
                ? "List a service"
                : "Create marketplace offer"}
          </h2>
          <button type="button" className="marketplace-modal__close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <form className="marketplace-modal__form marketplace-modal__form--create" onSubmit={(e) => void handleSubmit(e)}>
          {error && <div className="marketplace-modal__error">{error}</div>}

          <div className="marketplace-modal__kind" role="group" aria-label="Listing type">
            <button
              type="button"
              className={`marketplace-modal__kind-btn ${!isService ? "is-active" : ""}`}
              onClick={() => handleKindChange("goods")}
            >
              Product
            </button>
            <button
              type="button"
              className={`marketplace-modal__kind-btn ${isService ? "is-active" : ""}`}
              onClick={() => handleKindChange("service")}
            >
              Service
            </button>
          </div>
          <p className="marketplace-modal__hint">
            {isService
              ? "For photography, tailoring, repairs, and other booked work. No stock count needed."
              : "For items you sell by quantity, like food, clothes, or farm produce."}
          </p>

          <label className="marketplace-modal__label">
            {isService ? "Service name" : "Title"}
            <input
              className="marketplace-modal__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder={isService ? "e.g. Wedding photography, Native wear tailoring" : ""}
              required
            />
          </label>
          <label className="marketplace-modal__label">
            Description
            <textarea
              className="marketplace-modal__textarea marketplace-modal__textarea--compact"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={
                isService
                  ? "What is included, how booking works, and what customers should prepare."
                  : ""
              }
            />
          </label>
          <div className="marketplace-modal__grid2 marketplace-modal__grid2--tight">
            <label className="marketplace-modal__label">
              Category
              <select
                className="marketplace-modal__input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {mergedCats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="marketplace-modal__label">
              {isService ? "Rate (₦ Naira)" : "Price (₦ Naira)"}
              <input
                className="marketplace-modal__input"
                type="number"
                min={0}
                step="0.01"
                value={priceNaira}
                onChange={(e) => setPriceNaira(e.target.value)}
                required
              />
            </label>
          </div>

          {isService ? (
            <>
              <div className="marketplace-modal__grid2 marketplace-modal__grid2--tight">
                <label className="marketplace-modal__label">
                  Priced as
                  <select
                    className="marketplace-modal__input"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="">Select</option>
                    {SERVICE_UNITS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="marketplace-modal__label">
                  Duration or package
                  <input
                    className="marketplace-modal__input"
                    value={durationNote}
                    onChange={(e) => setDurationNote(e.target.value)}
                    placeholder="e.g. 2 hours, 3 outfits, full-day shoot"
                  />
                </label>
              </div>
              <div className="marketplace-modal__grid2 marketplace-modal__grid2--tight">
                <label className="marketplace-modal__label">
                  Where you work
                  <select
                    className="marketplace-modal__input"
                    value={serviceLocation}
                    onChange={(e) => setServiceLocation(e.target.value)}
                  >
                    <option value="">Select</option>
                    {SERVICE_PLACES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="marketplace-modal__label">
                  Service area
                  <input
                    className="marketplace-modal__input"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder="e.g. Jos and nearby towns"
                  />
                </label>
              </div>
              <label className="marketplace-modal__label">
                Availability
                <input
                  className="marketplace-modal__input"
                  value={availabilityNote}
                  onChange={(e) => setAvailabilityNote(e.target.value)}
                  placeholder="e.g. Weekends, book 3 days ahead"
                />
              </label>
            </>
          ) : (
            <>
              <div className="marketplace-modal__toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={quantityTracked}
                    onChange={(e) => setQuantityTracked(e.target.checked)}
                  />
                  Track quantity in stock
                </label>
              </div>
              {quantityTracked ? (
                <label className="marketplace-modal__label">
                  Quantity in stock
                  <input
                    className="marketplace-modal__input"
                    type="number"
                    min={1}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required={quantityTracked}
                  />
                </label>
              ) : (
                <label className="marketplace-modal__label">
                  Note (optional)
                  <input
                    className="marketplace-modal__input"
                    value={quantityNote}
                    onChange={(e) => setQuantityNote(e.target.value)}
                    placeholder="Not sold by fixed unit count"
                  />
                </label>
              )}
            </>
          )}

          <div className="marketplace-modal__media-block">
            <span className="marketplace-modal__media-heading">Photos &amp; videos</span>
            <p className="marketplace-modal__hint">
              {isService
                ? "Show your work, studio, or finished jobs. Up to " + MAX_MEDIA + " files, 50MB each."
                : `Upload images or short clips. Up to ${MAX_MEDIA} files, 50MB each.`}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="marketplace-modal__file-input"
              onChange={(e) => void handleFileChange(e)}
              disabled={uploading || mediaItems.length >= MAX_MEDIA}
            />
            <button
              type="button"
              className="marketplace-modal__dropzone"
              onClick={handlePickFiles}
              disabled={uploading || mediaItems.length >= MAX_MEDIA}
            >
              {uploading ? (
                <>
                  <Loader2 className="marketplace-modal__spin" size={22} aria-hidden />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={22} aria-hidden />
                  Add photos or videos
                </>
              )}
            </button>
            {mediaItems.length > 0 && (
              <ul className="marketplace-modal__media-grid">
                {mediaItems.map((m, i) => (
                  <li key={`${m.url}-${i}`} className="marketplace-modal__media-tile">
                    {m.type === "video" ? (
                      <video className="marketplace-modal__media-thumb" src={m.url} muted playsInline />
                    ) : (
                      <img className="marketplace-modal__media-thumb" src={m.url} alt="" />
                    )}
                    <button
                      type="button"
                      className="marketplace-modal__media-remove"
                      onClick={() => removeMedia(i)}
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h3 className="marketplace-modal__section-title marketplace-modal__section-title--divider">
            Payout account
          </h3>
          <div className="marketplace-modal__grid2 marketplace-modal__grid2--tight">
            <label className="marketplace-modal__label">
              Bank name
              <input
                className="marketplace-modal__input"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </label>
            <label className="marketplace-modal__label">
              Account number
              <input
                className="marketplace-modal__input"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="marketplace-modal__label">
            Account name
            <input
              className="marketplace-modal__input"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              required
            />
          </label>

          <h3 className="marketplace-modal__section-title marketplace-modal__section-title--divider">
            {isService ? "Booking contact" : "Seller contact details"}
          </h3>
          <div className="marketplace-modal__grid2 marketplace-modal__grid2--tight">
            <label className="marketplace-modal__label">
              Contact name
              <input
                className="marketplace-modal__input"
                value={sellerContactName}
                onChange={(e) => setSellerContactName(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </label>
            <label className="marketplace-modal__label">
              Contact phone
              <input
                className="marketplace-modal__input"
                value={sellerContactPhone}
                onChange={(e) => setSellerContactPhone(e.target.value)}
                placeholder="+234..."
              />
            </label>
          </div>
          <div className="marketplace-modal__grid2 marketplace-modal__grid2--tight">
            <label className="marketplace-modal__label">
              Contact email
              <input
                className="marketplace-modal__input"
                type="email"
                value={sellerContactEmail}
                onChange={(e) => setSellerContactEmail(e.target.value)}
                placeholder="seller@domain.com"
              />
            </label>
            <label className="marketplace-modal__label">
              WhatsApp (optional)
              <input
                className="marketplace-modal__input"
                value={sellerContactWhatsapp}
                onChange={(e) => setSellerContactWhatsapp(e.target.value)}
                placeholder="+234..."
              />
            </label>
          </div>

          <div className="marketplace-modal__actions">
            <button type="button" className="marketplace-modal__btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="marketplace-modal__btn-primary" disabled={saving || uploading}>
              {saving
                ? "Saving…"
                : initialListing
                  ? "Save changes"
                  : isService
                    ? "Publish service"
                    : "Publish offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListingModal;

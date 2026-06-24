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
  "Financial service",
  "Gifts & Occasions",
  "Home & Garden",
  "Other",
];

const MAX_MEDIA = 8;

export interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  initialListing?: ApiMarketplaceListing | null;
  onSubmit: (payload: {
    title: string;
    description: string;
    category: string;
    priceNaira: number;
    quantityTracked: boolean;
    stockQuantity: number | null;
    quantityNote: string | null;
    media: ApiMediaItem[];
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    sellerContactName: string;
    sellerContactPhone: string;
    sellerContactEmail: string;
    sellerContactWhatsapp: string;
  }) => Promise<{ success: boolean; message?: string }>;
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
  const [priceNaira, setPriceNaira] = useState("");
  const [quantityTracked, setQuantityTracked] = useState(true);
  const [stockQuantity, setStockQuantity] = useState("");
  const [quantityNote, setQuantityNote] = useState("");
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

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (initialListing) {
      setTitle(initialListing.title);
      setDescription(initialListing.description || "");
      setCategory(initialListing.category || "Other");
      setPriceNaira(String(initialListing.price ?? ""));
      setQuantityTracked(!!initialListing.quantity_tracked);
      setStockQuantity(
        initialListing.quantity_tracked ? String(initialListing.stock ?? "") : ""
      );
      setQuantityNote(initialListing.quantity_note || "");
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
      setPriceNaira("");
      setQuantityTracked(true);
      setStockQuantity("");
      setQuantityNote("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const price = Number(priceNaira.replace(/,/g, ""));
    if (!title.trim()) {
      setError("Title is required.");
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
    if (quantityTracked) {
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
      priceNaira: price,
      quantityTracked,
      stockQuantity: stock,
      quantityNote: quantityTracked ? null : quantityNote.trim() || null,
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
            {initialListing ? "Edit offer" : "Create marketplace offer"}
          </h2>
          <button type="button" className="marketplace-modal__close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <form className="marketplace-modal__form marketplace-modal__form--create" onSubmit={(e) => void handleSubmit(e)}>
          {error && <div className="marketplace-modal__error">{error}</div>}
          <label className="marketplace-modal__label">
            Title
            <input
              className="marketplace-modal__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
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
              Price (₦ Naira)
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
              Note (optional — e.g. how you deliver this service)
              <input
                className="marketplace-modal__input"
                value={quantityNote}
                onChange={(e) => setQuantityNote(e.target.value)}
                placeholder="Not sold by fixed unit count"
              />
            </label>
          )}

          <div className="marketplace-modal__media-block">
            <span className="marketplace-modal__media-heading">Photos &amp; videos</span>
            <p className="marketplace-modal__hint">
              Upload images or short clips. Up to {MAX_MEDIA} files, 50MB each.
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
            Seller contact details
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
              {saving ? "Saving…" : initialListing ? "Save changes" : "Publish offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListingModal;

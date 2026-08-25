import React, { useState } from "react";
import { Flag, X } from "lucide-react";
import {
  REPORT_REASONS,
  submitSafetyReport,
  type SafetyContentType,
} from "../services/safetyReportApi";
import { isAuthenticated } from "../utils/userUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  contentType: SafetyContentType;
  contentId?: string | number | null;
  reportedUserId?: number | null;
};

const ReportModal: React.FC<Props> = ({
  open,
  onClose,
  contentType,
  contentId,
  reportedUserId,
}) => {
  const [reason, setReason] = useState("child_safety");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setReason("child_safety");
    setDescription("");
    setBusy(false);
    setError(null);
    setDone(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (busy) return;
    if (!isAuthenticated()) {
      setError("Sign in to submit a report.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await submitSafetyReport({
      content_type: contentType,
      content_id: contentId,
      reported_user_id: reportedUserId,
      reason,
      description,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.message || "Could not submit this report.");
      return;
    }
    setDone(
      result.already_reported
        ? "You already reported this."
        : result.message || "Report submitted. Thank you."
    );
  };

  return (
    <div
      className="report-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="report-modal__backdrop" onClick={close} />
      <div className="report-modal__card">
        <div className="report-modal__header">
          <h2 id="report-modal-title">
            <Flag size={18} /> Report a safety concern
          </h2>
          <button type="button" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {done ? (
          <p className="report-modal__success">{done}</p>
        ) : (
          <>
            <label className="report-modal__label" htmlFor="report-reason">
              Reason
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REPORT_REASONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <label className="report-modal__label" htmlFor="report-details">
              Optional details
            </label>
            <textarea
              id="report-details"
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Do not attach images here. Describe what happened."
            />
            {error ? <p className="report-modal__error">{error}</p> : null}
            <button
              type="button"
              className="report-modal__submit"
              disabled={busy}
              onClick={() => void submit()}
            >
              {busy ? "Sending…" : "Submit report"}
            </button>
          </>
        )}
        <p className="report-modal__hint">
          Immediate danger: contact local emergency services. Child-safety contact:{" "}
          <a href="mailto:child-safety@joscity.com">child-safety@joscity.com</a>
        </p>
      </div>
    </div>
  );
};

export default ReportModal;

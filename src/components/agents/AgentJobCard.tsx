import { useState, type ReactNode } from "react";
import { Check, Lock } from "lucide-react";
import {
  escrowTotal,
  jobDescription,
  jobImages,
  jobStepIndex,
  jobSteps,
  jobTitle,
  lastAgentStepIndex,
  nextStageLock,
  vendorPayoutStatus,
  type Job,
} from "../../api/agent";
import AgentStars from "./AgentStars";

function money(value: unknown) {
  return `NGN ${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export default function AgentJobCard({
  job,
  role = "agent",
  advancing,
  extraActions,
  onAdvance,
  onPurchase,
  onConfirm,
  onRate,
}: {
  job: Job;
  role?: "agent" | "requester";
  advancing?: boolean;
  extraActions?: ReactNode;
  onAdvance?: () => void;
  onPurchase?: () => void;
  onConfirm?: () => void;
  onRate?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const steps = jobSteps(job);
  const current = jobStepIndex(job);
  const lastAgent = lastAgentStepIndex(job);
  const funded = job.escrow_status === "held";
  const cancelled = Boolean(job.cancelled_at);
  const lock = nextStageLock(job, role);
  const photos = jobImages(job);
  const details = jobDescription(job);
  const title = jobTitle(job);
  const reviewed = Boolean(job.reviewed || job.review_rating);
  const status = cancelled ? "Cancelled" : job.payout_pending_manual ? "Pending payout" : job.stage_label;
  const vendor = vendorPayoutStatus(job).replace(/^Vendor payout:\s*/i, "");
  const purchaseNext = role === "agent" && job.source_type === "buy" && current === 1 && funded && Boolean(onPurchase);
  const confirmNext = role === "requester" && current === lastAgent && funded && Boolean(onConfirm);
  const advanceNext = role === "agent" && current < lastAgent && !purchaseNext && Boolean(onAdvance);
  const interactive = !cancelled && (purchaseNext || confirmNext || (advanceNext && !lock));
  const hint = cancelled
    ? null
    : lock && !(purchaseNext || confirmNext)
      ? lock
      : role === "requester" && current < lastAgent
        ? "Your agent updates this progress as the job moves along."
        : null;

  const selectStage = (index: number) => {
    if (cancelled || advancing || index !== current + 1) return;
    if (purchaseNext) {
      onPurchase?.();
      return;
    }
    if (confirmNext) {
      onConfirm?.();
      return;
    }
    if (advanceNext && !lock) onAdvance?.();
  };

  return (
    <section className="agent-card agent-job-card">
      <div className="agent-job-card__head">
        {photos[0] ? <img src={photos[0]} alt="" className="agent-job-card__thumb" /> : null}
        <div>
          <p className="agent-job-card__kicker">{job.source_type === "buy" ? "Help me buy" : "Help me deliver"}</p>
          <h2>{title}</h2>
        </div>
        <span className={`agent-job-card__pill${cancelled ? " is-muted" : ""}`}>{status}</span>
      </div>

      <div className="agent-job-card__totals">
        <div><span>Total</span><strong>{money(escrowTotal(job))}</strong></div>
        <div><span>Escrow</span><b className={funded ? "is-good" : ""}>{funded ? `Holding ${money(escrowTotal(job))}` : "Not funded yet"}</b></div>
        {job.source_type === "buy" ? <div><span>Vendor</span><b>{vendor || "Not sent"}</b></div> : null}
      </div>

      <p className="agent-job-card__section">Progress</p>
      <ol className="agent-job-card__timeline">
        {steps.map((step, index) => {
          const done = index < current;
          const now = index === current;
          const next = index === current + 1;
          const canSelect = interactive && next;
          const lockedNext = next && !canSelect && Boolean(lock);
          const hintText = now
            ? "Current stage"
            : canSelect
              ? advancing
                ? "Updating…"
                : purchaseNext
                  ? "Tap to pay the vendor"
                  : confirmNext
                    ? "Tap to confirm delivery"
                    : "Tap to mark"
              : lockedNext
                ? lock
                : null;
          return (
            <li key={step} className="agent-job-card__step">
              <span className={`agent-job-card__dot${done ? " is-done" : ""}${now ? " is-now" : ""}${canSelect ? " is-next" : ""}`}>
                {done ? <Check size={11} /> : lockedNext ? <Lock size={9} /> : now ? <span /> : null}
              </span>
              <button
                type="button"
                className={`agent-job-card__stage${now ? " is-now" : ""}${canSelect ? " is-next" : ""}${lockedNext ? " is-locked" : ""}`}
                disabled={!canSelect || Boolean(advancing)}
                aria-current={now ? "step" : undefined}
                onClick={() => selectStage(index)}
              >
                <strong>{step}</strong>
                {hintText ? <small>{hintText}</small> : null}
              </button>
            </li>
          );
        })}
      </ol>
      {hint ? <p className="agent-job-card__hint">{hint}</p> : null}

      {reviewed ? (
        <div className="agent-job-card__rated">
          <AgentStars value={Number(job.review_rating || 0)} />
          {job.review_comment ? <p>{job.review_comment}</p> : null}
        </div>
      ) : role === "requester" && job.stage === 4 && onRate ? (
        <button type="button" className="primary" onClick={onRate}>Rate this agent</button>
      ) : null}

      <button type="button" onClick={() => setExpanded((open) => !open)}>
        {expanded ? "Hide request details" : "View request details"}
      </button>
      {expanded ? (
        <div className="agent-job-card__details">
          {photos.length ? (
            <div className="agent-images">
              {photos.map((src) => <img key={src} src={src} alt="" />)}
            </div>
          ) : null}
          <p>{details || "No extra description was added."}</p>
          {job.pickup_address ? <p>Pickup: {job.pickup_address}</p> : null}
          {job.destination_address ? <p>Delivery: {job.destination_address}</p> : null}
        </div>
      ) : null}
      {extraActions}
    </section>
  );
}

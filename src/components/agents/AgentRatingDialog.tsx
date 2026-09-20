import { useState } from "react";
import { agentApi, jobTitle, type Job } from "../../api/agent";
import AgentStars from "./AgentStars";

export default function AgentRatingDialog({
  job,
  onClose,
  onDone,
}: {
  job: Job | null;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!job) return null;

  const close = () => {
    setRating(0);
    setComment("");
    setError("");
    setBusy(false);
    onClose();
  };

  const submit = async () => {
    if (rating < 1) {
      setError("Choose 1 to 5 stars.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await agentApi.review(job.job_id, { rating, comment: comment.trim() });
      onDone("Thanks. Your rating is now public on the agent’s profile.");
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit this rating.");
      setBusy(false);
    }
  };

  return (
    <div className="agent-dialog-backdrop" onClick={close}>
      <form
        className="agent-card agent-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Rate this agent"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <p className="agent-job-card__kicker">Rate your agent</p>
        <h2>{jobTitle(job)}</h2>
        <p>Stars are public on the agent’s profile. Hate speech and curse words are not allowed.</p>
        <AgentStars value={rating} onSelect={setRating} label="Choose a star rating" />
        <label>
          How did this job go? (optional)
          <textarea value={comment} disabled={busy} onChange={(event) => setComment(event.target.value)} />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button className="primary" disabled={busy}>{busy ? "Sending…" : "Submit rating"}</button>
        <button type="button" disabled={busy} onClick={close}>Later</button>
      </form>
    </div>
  );
}

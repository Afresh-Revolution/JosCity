export default function AgentFeeBenefit({
  feeAmount,
  totalPrice,
  formatAmount,
}: {
  feeAmount?: number | null;
  totalPrice?: number | null;
  formatAmount: (value: number) => string;
}) {
  const ready = Number.isFinite(Number(feeAmount)) && Number.isFinite(Number(totalPrice));
  return (
    <div className="agent-fee-benefit">
      <div className="agent-fee-benefit__row">
        <span>Your fee</span>
        <strong>{ready ? formatAmount(Number(feeAmount)) : "—"}</strong>
      </div>
      <div className="agent-fee-benefit__row">
        <span>Customer pays</span>
        <b>{ready ? formatAmount(Number(totalPrice)) : "—"}</b>
      </div>
    </div>
  );
}

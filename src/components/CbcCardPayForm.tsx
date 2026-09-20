import { useState } from "react";
import { formatCbcAmount, nairaToCbc } from "../utils/cbcQuote";
import { formatMarketplaceMoney } from "../utils/marketplaceDisplay";

export type CbcCardDetails = {
  cardNumber: string;
  cvc: string;
  cardPin: string;
};

type Props = {
  amountNaira: number;
  quote?: { cbc_ngn?: number | null } | null;
  busy?: boolean;
  error?: string | null;
  onPay: (details: CbcCardDetails) => void;
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export default function CbcCardPayForm({ amountNaira, quote, busy, error, onPay }: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardPin, setCardPin] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const cbcCopy = formatCbcAmount(amountNaira, quote);
  const example = quote?.cbc_ngn ? nairaToCbc(50000, quote) : 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const number = digits(cardNumber);
    const code = digits(cvc);
    const pin = digits(cardPin);
    if (number.length < 8 || number.length > 19) {
      setLocalError("Enter a valid CBC card number.");
      return;
    }
    if (!code) {
      setLocalError("Enter your CVC.");
      return;
    }
    if (pin.length < 4) {
      setLocalError("Enter your Card PIN.");
      return;
    }
    setLocalError(null);
    onPay({ cardNumber: number, cvc: code, cardPin: pin });
  };

  return (
    <form className="cbc-card-pay" onSubmit={submit}>
      <h4>Pay with CBC</h4>
      <p>
        Charge {formatMarketplaceMoney(amountNaira)}
        {cbcCopy ? ` ≈ ${cbcCopy}` : ""} from your CBrilliance card. JosCity never stores the card
        number, CVC, or PIN.
      </p>
      {example > 0 ? (
        <p className="cbc-card-pay__rate">
          Rate: {formatMarketplaceMoney(Number(quote?.cbc_ngn))} per CBC
          {` · ₦50,000 ≈ ${example.toLocaleString("en-US", { maximumFractionDigits: 3 })} CBC`}
        </p>
      ) : null}
      <label>
        CBC card number
        <input
          inputMode="numeric"
          autoComplete="cc-number"
          value={cardNumber}
          disabled={busy}
          onChange={(event) => setCardNumber(event.target.value)}
        />
      </label>
      <div className="cbc-card-pay__row">
        <label>
          CVC
          <input
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cvc}
            disabled={busy}
            type="password"
            onChange={(event) => setCvc(event.target.value)}
          />
        </label>
        <label>
          Card PIN
          <input
            inputMode="numeric"
            autoComplete="off"
            value={cardPin}
            disabled={busy}
            type="password"
            onChange={(event) => setCardPin(event.target.value)}
          />
        </label>
      </div>
      {(localError || error) && <div className="cbc-card-pay__error">{localError || error}</div>}
      <button type="submit" className="marketplace-checkout-main-btn" disabled={busy}>
        {busy ? "Charging card…" : "Pay with CBC"}
      </button>
    </form>
  );
}

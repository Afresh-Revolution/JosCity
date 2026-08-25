import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getPublicSupport, type PublicFaq } from "../services/supportApi";

type Props = {
  className?: string;
  heading?: string;
};

const CommonQuestions = ({ className = "", heading = "Common questions" }: Props) => {
  const [faqs, setFaqs] = useState<PublicFaq[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getPublicSupport()
      .then((data) => {
        if (!active) return;
        const rows = Array.isArray(data.faqs) ? data.faqs : [];
        setFaqs(rows);
        setOpenId(rows[0]?.id ?? null);
      })
      .catch(() => {
        if (active) setFaqs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading || faqs.length === 0) return null;

  return (
    <section className={`common-questions ${className}`.trim()}>
      <h2 className="common-questions__title">{heading}</h2>
      <div className="common-questions__list">
        {faqs.map((item) => {
          const open = openId === item.id;
          return (
            <article key={item.id} className={`common-questions__item${open ? " is-open" : ""}`}>
              <button
                type="button"
                className="common-questions__question"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                <span>{item.question}</span>
                <ChevronDown size={18} />
              </button>
              {open ? <p className="common-questions__answer">{item.answer}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default CommonQuestions;

import { useState } from "react";
import { useViewStore } from "../stores/view-store";

// Native questionnaire → POSTs to the public Google Form "Anvil PoC Feedback"
// in no-cors mode (CORS blocks the response, but the submission goes through).
// No backend, no key, no proxy. Mirrors auto-audiobook's SurveyPage.
const GOOGLE_FORM_ID =
  "1FAIpQLSfO2xHb0Koc3WUPWoubJpUAjTmwea9KlwUfLltZ-UW3JZ8KmQ";

const FIELD = {
  vet: "entry.802041725",
  impression: "entry.1758558717",
  pay: "entry.1009263761",
  role: "entry.128050824",
  contact: "entry.1435394282",
  feedback: "entry.586765347",
} as const;

// Option strings MUST match the form exactly (incl. spacing) or Google rejects
// the choice. Captured verbatim from the live form.
const VET = [
  "Gut feel / reputation",
  "Manually reading & cross-checking",
  "Citation / fact-checking tools",
  "I don't really vet them",
  "Linkedin (or other social media) posts",
];
const IMPRESSION = ["Love it", "Interesting", "Not sure yet", "Not for me"];
const PAY = ["Free only", "$1 to $5  / mo", "$5 to $15  / mo", "$15 to $30", "$30+  / mo"];
const ROLE = [
  "Researcher / scientist",
  "Academic / educator",
  "Journalist / editor",
  "Analyst",
  "Developer / tech",
  "Investor",
  "Just curious",
];

interface SurveyData {
  vet: string;
  impression: string;
  pay: string;
  role: string;
  contact: string;
  feedback: string;
}

export function SurveyPage() {
  const setView = useViewStore((s) => s.setView);
  const [data, setData] = useState<SurveyData>({
    vet: "",
    impression: "",
    pay: "",
    role: "",
    contact: "",
    feedback: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function update(field: keyof SurveyData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSending(true);
    const form = new URLSearchParams();
    form.append(FIELD.vet, data.vet);
    form.append(FIELD.impression, data.impression);
    form.append(FIELD.pay, data.pay);
    form.append(FIELD.role, data.role);
    form.append(FIELD.contact, data.contact);
    form.append(FIELD.feedback, data.feedback);

    try {
      await fetch(
        `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`,
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        },
      );
    } catch {
      // no-cors gives no readable response; the submission still lands.
    }

    try {
      const key = "anvil-poc-survey-responses";
      const prev = JSON.parse(localStorage.getItem(key) ?? "[]");
      prev.push({ ...data, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {
      /* ignore */
    }

    setSending(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-4 text-5xl">🙏</div>
        <h2 className="mb-3 text-2xl font-bold">Thank you!</h2>
        <p className="mb-6 text-fg-muted">
          Your feedback helps shape where anvil goes next.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setView("landing")}
            className="rounded-lg bg-accent px-6 py-2 font-medium text-accent-fg"
          >
            Back to the demo
          </button>
          <button
            onClick={() => setView("roadmap")}
            className="rounded-lg border border-line px-6 py-2 font-medium text-fg-muted hover:text-fg"
          >
            See the road ahead
          </button>
        </div>
      </div>
    );
  }

  const canSubmit =
    data.vet && data.impression && data.pay && data.role && !sending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          What do you think?
        </h1>
        <p className="text-fg-muted">
          Help shape anvil. Takes about 30 seconds.
        </p>
      </div>

      <div className="space-y-6">
        <Question label="How do you vet research or sources today?">
          <Pills options={VET} selected={data.vet} onSelect={(v) => update("vet", v)} />
        </Question>
        <Question label="First impression of anvil?">
          <Pills
            options={IMPRESSION}
            selected={data.impression}
            onSelect={(v) => update("impression", v)}
          />
        </Question>
        <Question label="Would you pay for automated source-trust analysis?">
          <Pills options={PAY} selected={data.pay} onSelect={(v) => update("pay", v)} />
        </Question>
        <Question label="Which describes you best?">
          <Pills options={ROLE} selected={data.role} onSelect={(v) => update("role", v)} />
        </Question>
        <Question label="E-Mail or Phone" optional id="survey-contact">
          <p className="mb-2 text-xs text-fg-muted">
            VC or generally interested? Leave contact info so we can reach out.
          </p>
          <input
            id="survey-contact"
            type="text"
            value={data.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="hello@world"
            className="w-full rounded-lg border border-line bg-canvas p-3 text-sm outline-none focus:ring-2 focus:ring-accent/50"
          />
        </Question>
        <Question label="Anything else you'd like to share?" optional id="survey-feedback">
          <textarea
            id="survey-feedback"
            value={data.feedback}
            onChange={(e) => update("feedback", e.target.value)}
            placeholder="Ideas, concerns, feature requests…"
            className="h-24 w-full resize-none rounded-lg border border-line bg-canvas p-3 text-sm outline-none focus:ring-2 focus:ring-accent/50"
          />
        </Question>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-lg bg-accent py-3 font-medium text-accent-fg disabled:opacity-40"
        >
          {sending ? "Sending…" : "Submit feedback"}
        </button>
      </div>
    </div>
  );
}

function Question({
  label,
  optional,
  children,
  id,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
        {optional && (
          <span className="ml-1 font-normal text-fg-muted">(optional)</span>
        )}
      </label>
      {children}
    </div>
  );
}

function Pills({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            selected === opt
              ? "border-accent bg-accent/10 text-accent"
              : "border-line text-fg-muted hover:border-fg-muted"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

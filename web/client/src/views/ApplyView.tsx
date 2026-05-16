import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Hourglass,
  Shapes,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { createApplication } from "../api/client";
import type { ApplicationFormData } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { defaultApplicationForm } from "../lib/applicationDefaults";
import { AUTH_TOKEN_KEY } from "../lib/authStorage";
import {
  formatFieldErrors,
  validateApplicationForm,
  validateApplicationStep,
} from "../lib/validateApplication";
import type { ViewType } from "../App";
import IntegerInput from "../components/IntegerInput";
import { PageShell, PageHeader, FadeIn, StaggerGrid } from "../components/layout/PageShell";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import { cardHover } from "../components/layout/motion";
import StepTabs from "../components/layout/StepTabs";

const inputClass =
  "w-full h-12 rounded-xl border border-outline-variant focus:border-primary outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest px-4 text-base";

export default function ApplyView({
  onNavigate,
  onApplicationCreated,
}: {
  onNavigate: (view: ViewType) => void;
  onApplicationCreated: (applicationId: string) => void;
}) {
  const { token, user, loginAsRole } = useAuth();
  const [form, setForm] = useState<ApplicationFormData>(defaultApplicationForm);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      loginAsRole("Founder").catch(() => undefined);
    }
  }, [token, loginAsRole]);

  const update = <K extends keyof ApplicationFormData>(
    key: K,
    value: ApplicationFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const readinessPreview = Math.min(
    100,
    Math.round(
      (form.problem.length > 20 ? 15 : 0) +
        (form.solution.length > 20 ? 15 : 0) +
        (form.companyName.length > 2 ? 10 : 0) +
        (form.runwayMonths > 0 ? 20 : 0) +
        (form.mrr > 0 ? 20 : 0) +
        (form.pitchText && form.pitchText.length > 30 ? 20 : 0),
    ),
  );

  const goNext = () => {
    const stepErrors = validateApplicationStep(form, step);
    if (stepErrors.length > 0) {
      setError(`Complete this step: ${formatFieldErrors(stepErrors)}`);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateApplicationForm(form);
    if (validationErrors.length > 0) {
      setError(formatFieldErrors(validationErrors));
      const first = validationErrors[0];
      const stepWithError = ["founderName", "founderEmail", "companyName", "country", "sector"].includes(
        first.field,
      )
        ? 0
        : ["problem", "solution", "targetCustomers"].includes(first.field)
          ? 1
          : first.field === "tractionSummary"
            ? 2
            : 3;
      setStep(stepWithError);
      return;
    }

    setSubmitting(true);
    try {
      let authToken = token;
      if (!authToken) {
        await loginAsRole("Founder");
        authToken = localStorage.getItem(AUTH_TOKEN_KEY);
      }
      if (!authToken) throw new Error("Could not sign in as demo founder");

      const payload: ApplicationFormData = {
        ...form,
        founderEmail: user?.email ?? form.founderEmail,
        pitchText:
          form.pitchText ||
          `${form.companyName}: ${form.solution}`.slice(0, 500),
      };

      const result = await createApplication(authToken, payload);
      onApplicationCreated(result.applicationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ["Founder", "Venture", "Traction", "Financials"];

  return (
    <PageShell className="pb-32">
      <PageHeader title="Apply" />

      <StepTabs steps={steps} current={step} onChange={setStep} layoutId="apply-step-underline" />

      <FadeIn delay={0.05}>
        <form
          noValidate
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h3 className="text-xl font-semibold text-on-surface">
              Step {step + 1}: {steps[step]}
            </h3>
            <span className="text-sm font-semibold text-on-surface-variant px-3 py-1 bg-surface-container-highest rounded-full">
              {step + 1} of {steps.length}
            </span>
          </div>

          <div className="p-8 space-y-6">
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Full Name</label>
                  <input
                    required
                    className={inputClass}
                    value={form.founderName}
                    onChange={(e) => update("founderName", e.target.value)}
                    placeholder="Ahmad Fauzi"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Work Email</label>
                  <input
                    required
                    type="email"
                    className={inputClass}
                    value={form.founderEmail}
                    onChange={(e) => update("founderEmail", e.target.value)}
                    placeholder="founder@demo.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-on-surface-variant">Company Name</label>
                  <input
                    required
                    className={inputClass}
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="EcoStream Solutions"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Country</label>
                  <input
                    required
                    className={inputClass}
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Sector</label>
                  <input
                    required
                    className={inputClass}
                    value={form.sector}
                    onChange={(e) => update("sector", e.target.value)}
                    placeholder="Cleantech"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Stage</label>
                  <select
                    className={inputClass}
                    value={form.stage}
                    onChange={(e) =>
                      update("stage", e.target.value as ApplicationFormData["stage"])
                    }
                  >
                    <option value="Idea">Idea</option>
                    <option value="MVP">MVP</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Growth">Growth</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Company age (months)
                  </label>
                  <IntegerInput
                    className={inputClass}
                    value={form.companyAgeMonths}
                    onChange={(v) => update("companyAgeMonths", v)}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Problem</label>
                  <textarea
                    required
                    rows={3}
                    className={`${inputClass} h-auto py-3`}
                    value={form.problem}
                    onChange={(e) => update("problem", e.target.value)}
                    placeholder="Pain point"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Solution</label>
                  <textarea
                    required
                    rows={3}
                    className={`${inputClass} h-auto py-3`}
                    value={form.solution}
                    onChange={(e) => update("solution", e.target.value)}
                    placeholder="Your solution"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Target customers
                  </label>
                  <textarea
                    required
                    rows={2}
                    className={`${inputClass} h-auto py-3`}
                    value={form.targetCustomers}
                    onChange={(e) => update("targetCustomers", e.target.value)}
                    placeholder="Target customers"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Pitch summary</label>
                  <textarea
                    rows={2}
                    className={`${inputClass} h-auto py-3`}
                    value={form.pitchText ?? ""}
                    onChange={(e) => update("pitchText", e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Traction summary
                  </label>
                  <textarea
                    required
                    rows={2}
                    className={`${inputClass} h-auto py-3`}
                    value={form.tractionSummary}
                    onChange={(e) => update("tractionSummary", e.target.value)}
                    placeholder="Revenue, pilots, users"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">MRR (RM)</label>
                  <IntegerInput
                    className={inputClass}
                    value={form.mrr}
                    onChange={(v) => update("mrr", v)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Active users</label>
                  <IntegerInput
                    className={inputClass}
                    value={form.activeUsers}
                    onChange={(v) => update("activeUsers", v)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Pilots</label>
                  <IntegerInput
                    className={inputClass}
                    value={form.pilots}
                    onChange={(v) => update("pilots", v)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Revenue growth %
                  </label>
                  <IntegerInput
                    className={inputClass}
                    value={form.revenueGrowthPct}
                    onChange={(v) => update("revenueGrowthPct", v)}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">CAC (RM)</label>
                  <IntegerInput
                    className={inputClass}
                    value={form.cac}
                    onChange={(v) => update("cac", v)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Monthly burn (RM)
                  </label>
                  <IntegerInput
                    className={inputClass}
                    value={form.burnMonthly}
                    onChange={(v) => update("burnMonthly", v)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Runway (months)</label>
                  <IntegerInput
                    className={inputClass}
                    value={form.runwayMonths}
                    onChange={(v) => update("runwayMonths", v)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Gross margin %
                  </label>
                  <IntegerInput
                    className={inputClass}
                    value={form.grossMarginPct}
                    max={100}
                    onChange={(v) => update("grossMarginPct", v)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Funding ask (RM)</label>
                  <IntegerInput
                    className={inputClass}
                    value={form.fundingAsk}
                    onChange={(v) => update("fundingAsk", v)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-on-surface-variant">Use of funds</label>
                  <textarea
                    required
                    rows={2}
                    className={`${inputClass} h-auto py-3`}
                    value={form.useOfFunds}
                    onChange={(e) => update("useOfFunds", e.target.value)}
                    placeholder="Use of funds"
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="text-error text-sm font-medium bg-error-container/30 p-3 rounded-lg space-y-1"
              >
                <p>{error}</p>
                {error.includes("Complete this step") ? (
                  <p className="text-xs font-normal text-on-surface-variant">
                    Fill required fields on this step.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="p-6 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft size={20} />
              Back
            </Button>
            <div className="flex gap-3">
              {step < steps.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  Next
                  <ArrowRight size={20} />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Auditing…
                    </>
                  ) : (
                    <>
                      Submit
                      <ArrowRight size={20} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>

      </FadeIn>

      <FadeIn delay={0.1}>
        <h3 className="text-xl font-semibold mb-4 text-on-background">Live preview</h3>
        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <StatCard label="Company" value={form.companyName || "—"} icon={Building2} />
          <StatCard
            label="Runway"
            value={form.runwayMonths > 0 ? `${form.runwayMonths} mo` : "—"}
            icon={Hourglass}
          />
          <StatCard label="Sector" value={form.sector || "—"} icon={Shapes} />
          <StatCard
            label="Complete"
            value={`${readinessPreview}%`}
            icon={ShieldCheck}
            accent="primary"
          />
        </StaggerGrid>
      </FadeIn>
    </PageShell>
  );
}

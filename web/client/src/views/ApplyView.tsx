import { useEffect, useState, type FormEvent } from "react";
import {
  Rocket,
  Menu,
  Info,
  ArrowLeft,
  ArrowRight,
  Building2,
  Hourglass,
  Shapes,
  ShieldCheck,
  LayoutDashboard,
  GitBranch,
  Edit,
  User,
  Loader2,
} from "lucide-react";
import { createApplication } from "../api/client";
import type { ApplicationFormData } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { defaultApplicationForm } from "../lib/applicationDefaults";
import {
  formatFieldErrors,
  validateApplicationForm,
  validateApplicationStep,
} from "../lib/validateApplication";
import type { ViewType } from "../App";

const inputClass =
  "w-full h-12 rounded-xl border border-outline-variant focus:border-primary outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest px-4 text-base";

export default function ApplyView({
  onNavigate,
  onApplicationCreated,
}: {
  onNavigate: (view: ViewType) => void;
  onApplicationCreated: (applicationId: string) => void;
}) {
  const { token, loginAsRole } = useAuth();
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

    if (form.founderEmail.toLowerCase() !== "founder@demo.com") {
      setError(
        "Demo login uses founder@demo.com — keep that email or sign in with the matching account.",
      );
      setStep(0);
      return;
    }

    setSubmitting(true);
    try {
      let authToken = token;
      if (!authToken) {
        await loginAsRole("Founder");
        authToken = localStorage.getItem("cradle_auth_token");
      }
      if (!authToken) throw new Error("Could not sign in as demo founder");

      const payload: ApplicationFormData = {
        ...form,
        founderEmail: form.founderEmail || "founder@demo.com",
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
    <>
      <header className="bg-surface-bright border-b border-outline-variant fixed top-0 w-full z-50 h-16 flex justify-between items-center px-gutter md:px-margin-desktop">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("home")}>
          <Rocket className="text-primary" size={24} />
          <h1 className="text-xl font-bold text-primary tracking-tight">Cradle LinkRouter</h1>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="text-on-surface-variant hover:bg-surface-container-low transition-colors px-2 py-1 rounded-lg text-sm font-semibold"
            >
              Home
            </button>
            <button
              type="button"
              className="text-primary font-bold border-b-2 border-primary text-sm tracking-wide h-16"
            >
              Apply
            </button>
          </nav>
        </div>
        <button type="button" className="md:hidden text-primary">
          <Menu size={24} />
        </button>
      </header>

      <main className="pt-24 pb-32 px-gutter md:px-margin-desktop max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-on-background">Accelerator Application</h2>
          <p className="text-base text-on-surface-variant">
            Submit your profile for AI pitch audit and programme routing via the LinkRouter API.
          </p>
          <div className="mt-4 p-4 bg-secondary-container text-on-secondary-container rounded-xl flex gap-4 border border-outline-variant">
            <Info className="shrink-0" size={24} />
            <div className="text-sm">
              <p className="font-bold">Demo mode</p>
              <p className="mt-1 opacity-90">
                Signed in as <strong>founder@demo.com</strong>. Submission runs a live audit against
                seeded benchmarks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {steps.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                step === i
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden mb-8"
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
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.companyAgeMonths}
                    onChange={(e) => update("companyAgeMonths", Number(e.target.value))}
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
                    placeholder="Describe the pain point (min 20 characters)"
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
                    placeholder="How you solve it (min 20 characters)"
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
                    placeholder="Who you sell to (min 10 characters)"
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
                    placeholder="Revenue, pilots, users (min 10 characters)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">MRR (RM)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.mrr}
                    onChange={(e) => update("mrr", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Active users</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.activeUsers}
                    onChange={(e) => update("activeUsers", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Pilots</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.pilots}
                    onChange={(e) => update("pilots", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Revenue growth %
                  </label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.revenueGrowthPct}
                    onChange={(e) => update("revenueGrowthPct", Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">CAC (RM)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.cac}
                    onChange={(e) => update("cac", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Monthly burn (RM)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.burnMonthly}
                    onChange={(e) => update("burnMonthly", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Runway (months)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.runwayMonths}
                    onChange={(e) => update("runwayMonths", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Gross margin %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={inputClass}
                    value={form.grossMarginPct}
                    onChange={(e) => update("grossMarginPct", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Funding ask (RM)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.fundingAsk}
                    onChange={(e) => update("fundingAsk", Number(e.target.value))}
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
                    placeholder="How grant funds will be used (min 20 characters)"
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
                {error.includes("email") || error.includes("founder@demo") ? (
                  <p className="text-xs font-normal text-on-surface-variant">
                    Use a full email address like <strong>founder@demo.com</strong> (demo mode).
                  </p>
                ) : error.includes("min") || error.includes("characters") || error.includes("Complete this step") ? (
                  <p className="text-xs font-normal text-on-surface-variant">
                    Add more detail on problem, solution, traction, and use of funds (see placeholders).
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="p-6 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex items-center gap-2 text-on-surface-variant font-semibold text-sm px-6 py-3 rounded-xl hover:bg-surface-container-high transition-colors disabled:opacity-40"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div className="flex gap-4">
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="bg-primary text-on-primary font-semibold text-sm px-8 py-3 rounded-full shadow-lg flex items-center gap-2"
                >
                  Next
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-on-primary font-semibold text-sm px-8 py-3 rounded-full shadow-lg flex items-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Auditing…
                    </>
                  ) : (
                    <>
                      Submit & Audit
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        <h3 className="text-xl font-semibold mb-4 text-on-background">Live Eligibility Audit</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant">
            <Building2 className="text-outline mb-1" size={24} />
            <p className="text-xs font-medium">Company Status</p>
            <p className="text-xl font-semibold mt-4">
              {form.companyName ? form.companyName : "Not set"}
            </p>
          </div>
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant">
            <Hourglass className="text-outline mb-1" size={24} />
            <p className="text-xs font-medium">Runway</p>
            <p className="text-xl font-semibold mt-4">
              {form.runwayMonths > 0 ? `${form.runwayMonths} mo` : "—"}
            </p>
          </div>
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant">
            <Shapes className="text-outline mb-1" size={24} />
            <p className="text-xs font-medium">Sector</p>
            <p className="text-xl font-semibold mt-4">{form.sector || "—"}</p>
          </div>
          <div className="bg-primary-container text-on-primary-container rounded-xl p-4 border border-primary">
            <ShieldCheck className="mb-1" size={24} />
            <p className="text-xs font-medium">Form completeness</p>
            <p className="text-xl font-bold mt-4">{readinessPreview}%</p>
          </div>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-lowest shadow-lg border-t border-outline-variant rounded-t-xl px-4 pb-2">
        <button type="button" onClick={() => onNavigate("home")} className="flex flex-col items-center text-on-surface-variant">
          <LayoutDashboard size={20} />
          <span className="text-[11px] font-medium mt-1">Home</span>
        </button>
        <button type="button" className="flex flex-col items-center bg-secondary-container text-on-secondary-container rounded-full px-5 py-1">
          <Edit size={20} />
          <span className="text-[11px] font-medium mt-1">Apply</span>
        </button>
        <button type="button" className="flex flex-col items-center text-on-surface-variant">
          <User size={20} />
        </button>
      </nav>
    </>
  );
}

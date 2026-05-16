import { useAuth, type AppEntity } from "../context/AuthContext";

const OPTIONS: { value: AppEntity; label: string }[] = [
  { value: "startup", label: "Startup" },
  { value: "mentor", label: "Mentor" },
];

export default function RoleSwitcher() {
  const { entity, setEntity, switching } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="role-select" className="text-xs font-semibold text-on-surface-variant hidden sm:inline">
        View as
      </label>
      <select
        id="role-select"
        value={entity}
        disabled={switching}
        onChange={(e) => setEntity(e.target.value as AppEntity)}
        className="h-9 min-w-[120px] rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-60"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

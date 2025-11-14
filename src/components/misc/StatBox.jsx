export const StatBox = ({ label, value, icon, className }) => (
  <div className="flex items-center gap-x-2">
    {icon && <span>{icon}</span>}
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-xl font-semibold ${className}`}>{value}</span>
    </div>
  </div>
);

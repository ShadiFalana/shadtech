interface BrandProps {
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className={`brand${compact ? ' brand-compact' : ''}`}>
      <span className="brand-mark" aria-hidden="true">
        S
      </span>
      <span className="brand-text">
        <strong>SHADTECH</strong>
        {!compact && <small>منصة الأعمال التقنية</small>}
      </span>
    </div>
  );
}

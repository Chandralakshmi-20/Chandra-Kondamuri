function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className = "",
}) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={21} />
        </div>
      </div>

      <div className="stat-content">
        <span>{title}</span>
        <h3>{value}</h3>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

export default StatCard;
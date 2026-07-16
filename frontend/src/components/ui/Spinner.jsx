const Spinner = ({ size = 32, className = '', full = false }) => {
  const spinner = (
    <div
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 10) }}
      className={`border-indigo-500 border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
  if (!full) return spinner;
  return <div className="flex justify-center py-20">{spinner}</div>;
};

export default Spinner;

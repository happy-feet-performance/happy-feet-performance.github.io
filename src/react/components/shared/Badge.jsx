export default function Badge({ type = "gold", children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

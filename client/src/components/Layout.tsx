import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="site-shell">
      <header className="nav">
        <Link className="brand" to="/" aria-label="TravelGlow home">
          <span className="brand-mark" aria-hidden="true">TG</span>
          TravelGlow
        </Link>
        <div className="nav-actions"><span className="phase-label">Travel skin planning</span><Link to="/admin/analytics">Demo analytics</Link></div>
      </header>
      {children}
    </div>
  );
}

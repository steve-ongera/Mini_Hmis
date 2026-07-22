import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found d-flex flex-column align-items-center justify-content-center vh-100 text-center px-3">
      <i className="bi bi-signpost-split display-1 text-primary mb-3"></i>
      <h1 className="h3 mb-2">Page not found</h1>
      <p className="text-muted mb-4">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/dashboard" className="btn btn-primary">
        <i className="bi bi-speedometer2 me-1"></i> Back to Dashboard
      </Link>
    </div>
  );
}
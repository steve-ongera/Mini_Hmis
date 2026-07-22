import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDoctor, getDoctorSchedule } from "../services/api";

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [doctorRes, scheduleRes] = await Promise.all([
        getDoctor(id),
        getDoctorSchedule(id, dateFilter || undefined),
      ]);
      setDoctor(doctorRes.data);
      setSchedule(scheduleRes.data.data || []);
    } catch (err) {
      if (err?.response?.status === 404) {
        setError("Doctor not found.");
      } else {
        setError("Couldn't load doctor details. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </span>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/doctors")}>
          Back to Doctors
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/doctors")}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1 className="h3 mb-0">{doctor.full_name}</h1>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Doctor Info</h2>
              <dl className="row mb-0 small">
                <dt className="col-5 text-muted">Specialization</dt>
                <dd className="col-7">{doctor.specialization}</dd>

                <dt className="col-5 text-muted">Email</dt>
                <dd className="col-7">{doctor.email}</dd>

                <dt className="col-5 text-muted">Phone</dt>
                <dd className="col-7">{doctor.phone}</dd>

                <dt className="col-5 text-muted">Status</dt>
                <dd className="col-7">
                  <span className={`badge bg-${doctor.is_active ? "success" : "secondary"}`}>
                    {doctor.is_active ? "Active" : "Inactive"}
                  </span>
                </dd>

                <dt className="col-5 text-muted">Patients</dt>
                <dd className="col-7">{doctor.patient_count}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 mb-0">Schedule</h2>
                <input
                  type="date"
                  className="form-control form-control-sm w-auto"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              {schedule.length === 0 ? (
                <p className="text-muted small mb-0">No appointments found.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {schedule.map((a) => (
                    <li key={a.id} className="list-group-item px-0 d-flex justify-content-between">
                      <div>
                        <div className="fw-semibold small">{a.patient_detail?.full_name}</div>
                        <div className="text-muted small">
                          {a.date} &middot; {a.start_time}–{a.end_time} &middot; {a.reason}
                        </div>
                      </div>
                      <span
                        className={`badge align-self-start bg-${
                          a.status === "scheduled"
                            ? "primary"
                            : a.status === "completed"
                            ? "success"
                            : "secondary"
                        }`}
                      >
                        {a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
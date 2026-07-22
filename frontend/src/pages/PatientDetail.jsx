import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPatient, getAppointments, assignDoctorToPatient, getDoctors } from "../services/api";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [patientRes, apptRes, doctorsRes] = await Promise.all([
        getPatient(id),
        getAppointments({ patient: id, ordering: "-date" }),
        getDoctors({ page_size: 100, is_active: true }),
      ]);
      setPatient(patientRes.data);
      setAppointments(apptRes.data.results || []);
      setDoctors(doctorsRes.data.results || []);
    } catch (err) {
      if (err?.response?.status === 404) {
        setError("Patient not found.");
      } else {
        setError("Couldn't load patient details. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (doctorId) => {
    try {
      const res = await assignDoctorToPatient(id, doctorId || null);
      setPatient(res.data.data);
    } catch {
      alert("Couldn't update doctor assignment.");
    }
  };

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
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/patients")}>
          Back to Patients
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/patients")}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1 className="h3 mb-0">{patient.full_name}</h1>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Patient Info</h2>
              <dl className="row mb-0 small">
                <dt className="col-5 text-muted">Date of Birth</dt>
                <dd className="col-7">{patient.date_of_birth}</dd>

                <dt className="col-5 text-muted">Gender</dt>
                <dd className="col-7">{patient.gender}</dd>

                <dt className="col-5 text-muted">Email</dt>
                <dd className="col-7">{patient.email}</dd>

                <dt className="col-5 text-muted">Phone</dt>
                <dd className="col-7">{patient.phone}</dd>

                <dt className="col-5 text-muted">Address</dt>
                <dd className="col-7">{patient.address || "—"}</dd>
              </dl>

              <hr />

              <label className="form-label small text-muted">Assigned Doctor</label>
              <select
                className="form-select form-select-sm"
                value={patient.assigned_doctor || ""}
                onChange={(e) => handleAssign(e.target.value)}
              >
                <option value="">Unassigned</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Appointment History</h2>
              {appointments.length === 0 ? (
                <p className="text-muted small mb-0">No appointments yet.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {appointments.map((a) => (
                    <li key={a.id} className="list-group-item px-0 d-flex justify-content-between">
                      <div>
                        <div className="fw-semibold small">{a.reason}</div>
                        <div className="text-muted small">
                          Dr. {a.doctor_detail?.full_name} &middot; {a.date} {a.start_time}–{a.end_time}
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
              <Link to="/appointments" className="btn btn-sm btn-outline-primary mt-3">
                <i className="bi bi-calendar-plus me-1"></i> Schedule New Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
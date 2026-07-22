import { useEffect, useState, useCallback } from "react";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getDoctors,
  getPatients,
} from "../services/api";

const EMPTY_FORM = {
  patient: "",
  doctor: "",
  date: "",
  start_time: "",
  end_time: "",
  reason: "",
  status: "scheduled",
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pageInfo, setPageInfo] = useState({ count: 0, current_page: 1, total_pages: 1 });
  const [page, setPage] = useState(1);

  const [doctorFilter, setDoctorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [conflictError, setConflictError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLookups = useCallback(async () => {
    try {
      const [doctorsRes, patientsRes] = await Promise.all([
        getDoctors({ page_size: 100, is_active: true }),
        getPatients({ page_size: 100 }),
      ]);
      setDoctors(doctorsRes.data.results || []);
      setPatients(patientsRes.data.results || []);
    } catch {
      // Non-fatal: dropdowns will just be empty.
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, ordering: "-date,-start_time" };
      if (doctorFilter) params.doctor = doctorFilter;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await getAppointments(params);
      setAppointments(res.data.results || []);
      setPageInfo(res.data);
    } catch (err) {
      setError("Couldn't load appointments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, doctorFilter, statusFilter, dateFilter]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setConflictError(null);
    setShowForm(true);
  };

  const openEditForm = (appt) => {
    setEditingId(appt.id);
    setFormData({
      patient: appt.patient,
      doctor: appt.doctor,
      date: appt.date,
      start_time: appt.start_time,
      end_time: appt.end_time,
      reason: appt.reason,
      status: appt.status,
    });
    setFormErrors({});
    setConflictError(null);
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormErrors({});
    setConflictError(null);
    try {
      if (editingId) {
        await updateAppointment(editingId, formData);
      } else {
        await createAppointment(formData);
      }
      setShowForm(false);
      fetchAppointments();
    } catch (err) {
      const errors = err?.response?.data?.errors || err?.response?.data || {};
      // The overlap rule surfaces as non_field_errors — show it prominently.
      if (errors.non_field_errors) {
        setConflictError(
          Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors
        );
      }
      setFormErrors(errors);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this appointment?")) return;
    try {
      await deleteAppointment(id);
      fetchAppointments();
    } catch {
      alert("Couldn't delete appointment. Please try again.");
    }
  };

  const handleCancel = async (appt) => {
    try {
      await updateAppointment(appt.id, { status: "cancelled" });
      fetchAppointments();
    } catch {
      alert("Couldn't cancel appointment.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="h3 mb-0">Appointments</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
          <i className="bi bi-calendar-plus me-1"></i> Schedule Appointment
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-6 col-md-4">
              <select
                className="form-select"
                value={doctorFilter}
                onChange={(e) => {
                  setPage(1);
                  setDoctorFilter(e.target.value);
                }}
              >
                <option value="">All doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => {
                  setPage(1);
                  setDateFilter(e.target.value);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h2 className="h6 mb-3">{editingId ? "Edit Appointment" : "New Appointment"}</h2>

            {conflictError && (
              <div className="alert alert-warning d-flex align-items-start" role="alert">
                <i className="bi bi-calendar-x me-2 mt-1"></i>
                <div>
                  <strong>Scheduling conflict:</strong> {conflictError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Patient</label>
                  <select
                    className={`form-select ${formErrors.patient ? "is-invalid" : ""}`}
                    name="patient"
                    value={formData.patient}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Doctor</label>
                  <select
                    className={`form-select ${formErrors.doctor ? "is-invalid" : ""}`}
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className={`form-control ${formErrors.date ? "is-invalid" : ""}`}
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                  />
                  {formErrors.date && <div className="invalid-feedback">{formErrors.date}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className={`form-control ${formErrors.start_time ? "is-invalid" : ""}`}
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className={`form-control ${formErrors.end_time ? "is-invalid" : ""}`}
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleFormChange}
                    required
                  />
                  {formErrors.end_time && (
                    <div className="invalid-feedback">{formErrors.end_time}</div>
                  )}
                </div>
                <div className="col-md-8">
                  <label className="form-label">Reason</label>
                  <input
                    className={`form-control ${formErrors.reason ? "is-invalid" : ""}`}
                    name="reason"
                    value={formData.reason}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingId ? "Save Changes" : "Schedule Appointment"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowForm(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date &amp; Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading appointments...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchAppointments}>
                      Retry
                    </button>
                  </td>
                </tr>
              )}

              {!isLoading && !error && appointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No appointments found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.patient_detail?.full_name}</td>
                    <td>{a.doctor_detail?.full_name}</td>
                    <td>
                      <div className="small">{a.date}</div>
                      <div className="small text-muted">
                        {a.start_time}–{a.end_time}
                      </div>
                    </td>
                    <td>{a.reason}</td>
                    <td>
                      <span
                        className={`badge bg-${
                          a.status === "scheduled"
                            ? "primary"
                            : a.status === "completed"
                            ? "success"
                            : "secondary"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => openEditForm(a)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      {a.status === "scheduled" && (
                        <button
                          className="btn btn-sm btn-outline-warning me-1"
                          onClick={() => handleCancel(a)}
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(a.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && !error && pageInfo.total_pages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              Page {pageInfo.current_page} of {pageInfo.total_pages} ({pageInfo.count} total)
            </span>
            <div className="btn-group">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={!pageInfo.previous}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={!pageInfo.next}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
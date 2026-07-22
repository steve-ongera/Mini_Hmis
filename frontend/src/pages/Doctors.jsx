import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from "../services/api";

const SPECIALIZATIONS = [
  ["general", "General Practice"],
  ["cardiology", "Cardiology"],
  ["dermatology", "Dermatology"],
  ["neurology", "Neurology"],
  ["pediatrics", "Pediatrics"],
  ["orthopedics", "Orthopedics"],
  ["psychiatry", "Psychiatry"],
  ["other", "Other"],
];

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  specialization: "general",
  email: "",
  phone: "",
  is_active: true,
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [pageInfo, setPageInfo] = useState({ count: 0, current_page: 1, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search) params.search = search;
      if (specializationFilter) params.specialization = specializationFilter;

      const res = await getDoctors(params);
      setDoctors(res.data.results || []);
      setPageInfo(res.data);
    } catch (err) {
      setError("Couldn't load doctors. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, specializationFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (doctor) => {
    setEditingId(doctor.id);
    setFormData({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      specialization: doctor.specialization,
      email: doctor.email,
      phone: doctor.phone,
      is_active: doctor.is_active,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormErrors({});
    try {
      if (editingId) {
        await updateDoctor(editingId, formData);
      } else {
        await createDoctor(formData);
      }
      setShowForm(false);
      fetchDoctors();
    } catch (err) {
      const errors = err?.response?.data?.errors || err?.response?.data || {};
      setFormErrors(errors);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this doctor? Their patients will become unassigned.")) return;
    try {
      await deleteDoctor(id);
      fetchDoctors();
    } catch {
      alert("Couldn't delete doctor. Please try again.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="h3 mb-0">Doctors</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
          <i className="bi bi-person-plus me-1"></i> Add Doctor
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="col-12 col-md-5">
              <select
                className="form-select"
                value={specializationFilter}
                onChange={(e) => {
                  setPage(1);
                  setSpecializationFilter(e.target.value);
                }}
              >
                <option value="">All specializations</option>
                {SPECIALIZATIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h2 className="h6 mb-3">{editingId ? "Edit Doctor" : "New Doctor"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <input
                    className={`form-control ${formErrors.first_name ? "is-invalid" : ""}`}
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleFormChange}
                    required
                  />
                  {formErrors.first_name && (
                    <div className="invalid-feedback">{formErrors.first_name}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <input
                    className={`form-control ${formErrors.last_name ? "is-invalid" : ""}`}
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleFormChange}
                    required
                  />
                  {formErrors.last_name && (
                    <div className="invalid-feedback">{formErrors.last_name}</div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Specialization</label>
                  <select
                    className="form-select"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleFormChange}
                  >
                    {SPECIALIZATIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                  {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Phone</label>
                  <input
                    className={`form-control ${formErrors.phone ? "is-invalid" : ""}`}
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    required
                  />
                  {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleFormChange}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Active
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingId ? "Save Changes" : "Create Doctor"}
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
                <th>Name</th>
                <th>Specialization</th>
                <th>Contact</th>
                <th>Patients</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading doctors...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchDoctors}>
                      Retry
                    </button>
                  </td>
                </tr>
              )}

              {!isLoading && !error && doctors.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No doctors found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                doctors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link to={`/doctors/${d.id}`} className="text-decoration-none fw-semibold">
                        {d.full_name}
                      </Link>
                    </td>
                    <td>
                      {SPECIALIZATIONS.find(([v]) => v === d.specialization)?.[1] || d.specialization}
                    </td>
                    <td>
                      <div className="small">{d.email}</div>
                      <div className="small text-muted">{d.phone}</div>
                    </td>
                    <td>{d.patient_count}</td>
                    <td>
                      <span className={`badge bg-${d.is_active ? "success" : "secondary"}`}>
                        {d.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => openEditForm(d)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(d.id)}
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
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  assignDoctorToPatient,
  getDoctors,
} from "../services/api";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "M",
  email: "",
  phone: "",
  address: "",
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pageInfo, setPageInfo] = useState({ count: 0, current_page: 1, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await getDoctors({ page_size: 100, is_active: true });
      setDoctors(res.data.results || []);
    } catch {
      // Non-fatal: doctor dropdown will just be empty.
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search) params.search = search;
      if (genderFilter) params.gender = genderFilter;
      if (unassignedOnly) params.unassigned = true;

      const res = await getPatients(params);
      setPatients(res.data.results || []);
      setPageInfo(res.data);
    } catch (err) {
      setError("Couldn't load patients. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, genderFilter, unassignedOnly]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (patient) => {
    setEditingId(patient.id);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      email: patient.email,
      phone: patient.phone,
      address: patient.address || "",
    });
    setFormErrors({});
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
    try {
      if (editingId) {
        await updatePatient(editingId, formData);
      } else {
        await createPatient(formData);
      }
      setShowForm(false);
      fetchPatients();
    } catch (err) {
      const errors = err?.response?.data?.errors || err?.response?.data || {};
      setFormErrors(errors);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this patient record? This cannot be undone.")) return;
    try {
      await deletePatient(id);
      fetchPatients();
    } catch {
      alert("Couldn't delete patient. Please try again.");
    }
  };

  const handleAssign = async (patientId, doctorId) => {
    try {
      await assignDoctorToPatient(patientId, doctorId || null);
      fetchPatients();
    } catch {
      alert("Couldn't update doctor assignment.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="h3 mb-0">Patients</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
          <i className="bi bi-person-plus me-1"></i> Add Patient
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select"
                value={genderFilter}
                onChange={(e) => {
                  setPage(1);
                  setGenderFilter(e.target.value);
                }}
              >
                <option value="">All genders</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div className="col-6 col-md-4 d-flex align-items-center">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="unassignedOnly"
                  checked={unassignedOnly}
                  onChange={(e) => {
                    setPage(1);
                    setUnassignedOnly(e.target.checked);
                  }}
                />
                <label className="form-check-label" htmlFor="unassignedOnly">
                  Unassigned only
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h2 className="h6 mb-3">{editingId ? "Edit Patient" : "New Patient"}</h2>
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
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className={`form-control ${formErrors.date_of_birth ? "is-invalid" : ""}`}
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleFormChange}
                    required
                  />
                  {formErrors.date_of_birth && (
                    <div className="invalid-feedback">{formErrors.date_of_birth}</div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
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
                <div className="col-md-6">
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
                <div className="col-md-6">
                  <label className="form-label">Address</label>
                  <input
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingId ? "Save Changes" : "Create Patient"}
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
                <th>Gender</th>
                <th>Contact</th>
                <th>Assigned Doctor</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading patients...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchPatients}>
                      Retry
                    </button>
                  </td>
                </tr>
              )}

              {!isLoading && !error && patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No patients found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/patients/${p.id}`} className="text-decoration-none fw-semibold">
                        {p.full_name}
                      </Link>
                    </td>
                    <td>{p.gender}</td>
                    <td>
                      <div className="small">{p.email}</div>
                      <div className="small text-muted">{p.phone}</div>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={p.assigned_doctor || ""}
                        onChange={(e) => handleAssign(p.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.full_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => openEditForm(p)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(p.id)}
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
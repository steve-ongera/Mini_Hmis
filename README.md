# Hospital Management System

A full-stack Hospital Management application: a Django REST Framework API (JWT-authenticated, with patients, doctors, and appointments) consumed by a React frontend.

---

## 1. Tech Stack

**Backend:** Django, Django REST Framework, Simple JWT, django-filter, drf-yasg (Swagger docs), SQLite/PostgreSQL
**Frontend:** React (Vite), React Router, Axios, Bootstrap 5 + Bootstrap Icons, Context API

---

## 2. Project Structure

### Backend (single app: `core`)

```
hospital_backend/
├── manage.py
├── requirements.txt
├── .env.example
├── hospital_backend/          # main project
│   ├── settings.py
│   ├── urls.py                # root urls -> includes core.urls
│   ├── wsgi.py / asgi.py
└── core/                      # the one app
    ├── models.py               # Doctor, Patient, Appointment
    ├── serializers.py          # DRF serializers + validation
    ├── services.py             # business logic (assignment, overlap checks)
    ├── utils.py                # helper functions (pagination, response helpers)
    ├── views.py                # ViewSets / APIViews
    ├── permissions.py          # custom permission classes
    ├── filters.py               # django-filter FilterSets
    ├── urls.py                  # app-level routes
    ├── tests/
    │   ├── test_models.py
    │   ├── test_serializers.py
    │   ├── test_views.py
    │   └── test_services.py
    └── admin.py
```

### Frontend (React + Vite)

```
hospital_frontend/
├── index.html                  # includes Bootstrap Icons CDN link
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/
    │   └── main.css
    ├── components/
    │   ├── Navbar.jsx
    │   ├── Sidebar.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── Loader.jsx
    │   └── ErrorAlert.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── Dashboard.jsx
    │   ├── Patients.jsx
    │   ├── PatientDetail.jsx
    │   ├── Doctors.jsx
    │   ├── DoctorDetail.jsx
    │   ├── Appointments.jsx
    │   └── NotFound.jsx
    ├── services/
    │   └── api.js               # axios instance + all endpoint calls
    └── context/
        └── AuthContext.jsx      # login/logout/token refresh/user state
```

---

## 3. Data Models

**Doctor**
- `id`, `first_name`, `last_name`, `specialization`, `email`, `phone`, `is_active`, `created_at`

**Patient**
- `id`, `first_name`, `last_name`, `date_of_birth`, `gender`, `email`, `phone`, `address`, `assigned_doctor` (FK → Doctor, nullable), `created_at`

**Appointment**
- `id`, `patient` (FK), `doctor` (FK), `date`, `start_time`, `end_time`, `reason`, `status` (`scheduled`/`completed`/`cancelled`), `created_at`
- **Constraint:** no two appointments for the same doctor may overlap in `[start_time, end_time)` on the same `date`. Enforced in `services.py` (checked in the serializer's `validate()`), not just at the DB level, so we can return a clean 400 with a helpful message.

---

## 4. Core Features

- **Authentication:** JWT (access + refresh) via `djangorestframework-simplejwt`; login, refresh, logout (blacklist) endpoints.
- **CRUD:** Full create/read/update/delete for Doctors, Patients, Appointments via `ModelViewSet`.
- **Patient ↔ Doctor assignment:** endpoint to assign/reassign a patient to a doctor.
- **Appointment overlap prevention:** business rule enforced in `services.py`, surfaced as a 400 validation error.
- **Pagination:** DRF `PageNumberPagination` (configurable page size).
- **Search & Filtering:** `django-filter` + DRF `SearchFilter` (e.g. search patients by name, filter appointments by doctor/date/status).
- **Validation:** serializer-level validation (email format, phone format, date/time sanity, future-dated appointments, etc.).
- **Proper HTTP status codes:** 200/201/204 for success, 400 for validation errors, 401/403 for auth issues, 404 for not found, 409-style conflict messaging (as 400) for overlaps.
- **API docs:** Swagger/OpenAPI via `drf-yasg` at `/swagger/`.
- **Tests:** unit tests for models/services (overlap logic) and integration tests for views (auth, CRUD, permissions).

---

## 5. API Endpoints (planned)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login/` | Obtain JWT access & refresh tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET/POST | `/api/doctors/` | List (paginated/search/filter) & create doctors |
| GET/PUT/PATCH/DELETE | `/api/doctors/{id}/` | Retrieve/update/delete doctor |
| GET/POST | `/api/patients/` | List (paginated/search/filter) & create patients |
| GET/PUT/PATCH/DELETE | `/api/patients/{id}/` | Retrieve/update/delete patient |
| PATCH | `/api/patients/{id}/assign-doctor/` | Assign/reassign patient to a doctor |
| GET/POST | `/api/appointments/` | List (paginated/search/filter) & create appointments |
| GET/PUT/PATCH/DELETE | `/api/appointments/{id}/` | Retrieve/update/delete appointment |
| GET | `/api/dashboard/stats/` | Summary counts for dashboard widgets |
| GET | `/swagger/` | Interactive API documentation |

Query params on list endpoints: `?search=`, `?ordering=`, `?page=`, plus model-specific filters (`?doctor=`, `?status=`, `?date=`, `?specialization=`).

---

## 6. Setup

### Backend
```bash
cd hospital_backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd hospital_frontend
npm install
npm run dev
```

Frontend expects the API at `http://localhost:8000/api/` (configurable via `.env` / `VITE_API_BASE_URL`).

---

## 7. Testing

```bash
python manage.py test
```
Covers: overlap-prevention logic, patient-doctor assignment, auth-protected routes, serializer validation edge cases.

---

## 8. Build Order (suggested, for the interview)

1. `models.py` → migrations
2. `serializers.py` (with validation)
3. `services.py` (overlap check, assignment logic)
4. `views.py` + `urls.py` + JWT wiring
5. `filters.py`, pagination, search
6. Swagger docs
7. Tests
8. React: `AuthContext` + `api.js` → `Login` → `Navbar`/`Sidebar` → `Dashboard` → `Patients`/`Doctors`/`Appointments` pages
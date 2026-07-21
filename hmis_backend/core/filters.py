import django_filters as filters

from .models import Appointment, Doctor, Patient


class DoctorFilter(filters.FilterSet):
    specialization = filters.ChoiceFilter(choices=Doctor.Specialization.choices)
    is_active = filters.BooleanFilter()
    name = filters.CharFilter(method="filter_name")

    class Meta:
        model = Doctor
        fields = ["specialization", "is_active"]

    def filter_name(self, queryset, name, value):
        from django.db.models import Q

        return queryset.filter(
            Q(first_name__icontains=value) | Q(last_name__icontains=value)
        )


class PatientFilter(filters.FilterSet):
    gender = filters.ChoiceFilter(choices=Patient.Gender.choices)
    assigned_doctor = filters.NumberFilter(field_name="assigned_doctor_id")
    unassigned = filters.BooleanFilter(method="filter_unassigned")
    min_age = filters.NumberFilter(method="filter_min_age")
    max_age = filters.NumberFilter(method="filter_max_age")

    class Meta:
        model = Patient
        fields = ["gender", "assigned_doctor"]

    def filter_unassigned(self, queryset, name, value):
        if value:
            return queryset.filter(assigned_doctor__isnull=True)
        return queryset.filter(assigned_doctor__isnull=False)

    def filter_min_age(self, queryset, name, value):
        cutoff = self._years_ago(int(value))
        return queryset.filter(date_of_birth__lte=cutoff)

    def filter_max_age(self, queryset, name, value):
        cutoff = self._years_ago(int(value))
        return queryset.filter(date_of_birth__gte=cutoff)

    @staticmethod
    def _years_ago(years):
        """Return today's date shifted back `years` years (stdlib only, no dateutil dependency)."""
        from datetime import date

        today = date.today()
        try:
            return today.replace(year=today.year - years)
        except ValueError:
            # Handles Feb 29 landing on a non-leap target year.
            return today.replace(year=today.year - years, day=28)


class AppointmentFilter(filters.FilterSet):
    doctor = filters.NumberFilter(field_name="doctor_id")
    patient = filters.NumberFilter(field_name="patient_id")
    status = filters.ChoiceFilter(choices=Appointment.Status.choices)
    date = filters.DateFilter(field_name="date")
    date_from = filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Appointment
        fields = ["doctor", "patient", "status", "date"]
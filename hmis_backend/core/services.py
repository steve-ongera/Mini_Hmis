"""
Business logic layer.

Keeping this separate from serializers/views makes the rules independently
testable and reusable (e.g. from the admin, management commands, or celery
tasks) without depending on request/response objects.
"""

from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError

from .models import Appointment, Doctor, Patient


class DoctorAssignmentService:
    """Handles assigning/reassigning a patient to a doctor."""

    @staticmethod
    def assign_patient_to_doctor(patient: Patient, doctor_id) -> Patient:
        if doctor_id is None:
            patient.assigned_doctor = None
            patient.save(update_fields=["assigned_doctor", "updated_at"])
            return patient

        try:
            doctor = Doctor.objects.get(pk=doctor_id)
        except (Doctor.DoesNotExist, ValueError, TypeError):
            raise ValidationError({"doctor_id": "Doctor not found."})

        if not doctor.is_active:
            raise ValidationError({"doctor_id": "Cannot assign patient to an inactive doctor."})

        patient.assigned_doctor = doctor
        patient.save(update_fields=["assigned_doctor", "updated_at"])
        return patient


class AppointmentSchedulingService:
    """Encapsulates the "no overlapping appointments for the same doctor" rule."""

    @staticmethod
    def has_overlap(doctor: Doctor, date, start_time, end_time, exclude_id=None) -> bool:
        qs = Appointment.objects.filter(
            doctor=doctor,
            date=date,
            status=Appointment.Status.SCHEDULED,
        )
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)

        # Two ranges [s1, e1) and [s2, e2) overlap iff s1 < e2 and s2 < e1
        qs = qs.filter(start_time__lt=end_time, end_time__gt=start_time)
        return qs.exists()

    @staticmethod
    def validate_no_overlap(doctor: Doctor, date, start_time, end_time, exclude_id=None):
        if start_time >= end_time:
            raise ValidationError({"end_time": "end_time must be after start_time."})

        if AppointmentSchedulingService.has_overlap(
            doctor, date, start_time, end_time, exclude_id
        ):
            raise ValidationError(
                {
                    "non_field_errors": [
                        f"Dr. {doctor.full_name} already has an overlapping "
                        f"appointment on {date} between {start_time} and {end_time}."
                    ]
                }
            )

    @staticmethod
    def get_doctor_schedule(doctor: Doctor, date=None):
        qs = Appointment.objects.filter(doctor=doctor).exclude(
            status=Appointment.Status.CANCELLED
        )
        if date:
            qs = qs.filter(date=date)
        return qs.order_by("date", "start_time")


class DashboardService:
    """Aggregates summary stats for the dashboard page."""

    @staticmethod
    def get_stats():
        return {
            "total_doctors": Doctor.objects.filter(is_active=True).count(),
            "total_patients": Patient.objects.count(),
            "total_appointments": Appointment.objects.count(),
            "scheduled_appointments": Appointment.objects.filter(
                status=Appointment.Status.SCHEDULED
            ).count(),
            "completed_appointments": Appointment.objects.filter(
                status=Appointment.Status.COMPLETED
            ).count(),
            "cancelled_appointments": Appointment.objects.filter(
                status=Appointment.Status.CANCELLED
            ).count(),
            "unassigned_patients": Patient.objects.filter(
                assigned_doctor__isnull=True
            ).count(),
        }
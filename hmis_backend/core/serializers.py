from datetime import date as date_cls

from rest_framework import serializers

from .models import Appointment, Doctor, Patient
from .services import AppointmentSchedulingService


class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    patient_count = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "specialization",
            "email",
            "phone",
            "is_active",
            "patient_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_patient_count(self, obj):
        return obj.patients.count()

    def validate_first_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("First name cannot be blank.")
        return value.strip()

    def validate_last_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Last name cannot be blank.")
        return value.strip()


class DoctorMiniSerializer(serializers.ModelSerializer):
    """Lightweight nested representation to avoid deep/duplicate payloads."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Doctor
        fields = ["id", "full_name", "specialization", "email"]


class PatientSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    assigned_doctor_detail = DoctorMiniSerializer(source="assigned_doctor", read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "gender",
            "email",
            "phone",
            "address",
            "assigned_doctor",
            "assigned_doctor_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_date_of_birth(self, value):
        if value > date_cls.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        age = (date_cls.today() - value).days / 365.25
        if age > 130:
            raise serializers.ValidationError("Date of birth is not plausible.")
        return value

    def validate_assigned_doctor(self, doctor):
        if doctor is not None and not doctor.is_active:
            raise serializers.ValidationError(
                "Cannot assign patient to an inactive doctor."
            )
        return doctor


class AssignDoctorSerializer(serializers.Serializer):
    """Used by the patients/{id}/assign-doctor/ endpoint."""

    doctor_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_doctor_id(self, value):
        if value is None:
            return value
        if not Doctor.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("Doctor not found or inactive.")
        return value


class AppointmentSerializer(serializers.ModelSerializer):
    patient_detail = serializers.SerializerMethodField(read_only=True)
    doctor_detail = DoctorMiniSerializer(source="doctor", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",
            "patient_detail",
            "doctor",
            "doctor_detail",
            "date",
            "start_time",
            "end_time",
            "reason",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_patient_detail(self, obj):
        return {
            "id": obj.patient_id,
            "full_name": obj.patient.full_name,
            "email": obj.patient.email,
        }

    def validate_date(self, value):
        if value < date_cls.today():
            raise serializers.ValidationError("Appointment date cannot be in the past.")
        return value

    def validate_reason(self, value):
        if not value.strip():
            raise serializers.ValidationError("Reason cannot be blank.")
        return value.strip()

    def validate(self, attrs):
        # On PATCH, fields not sent won't be in attrs — fall back to instance values.
        instance = getattr(self, "instance", None)
        doctor = attrs.get("doctor", getattr(instance, "doctor", None))
        date = attrs.get("date", getattr(instance, "date", None))
        start_time = attrs.get("start_time", getattr(instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(instance, "end_time", None))
        status = attrs.get("status", getattr(instance, "status", Appointment.Status.SCHEDULED))

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "end_time must be after start_time."}
            )

        # Only enforce the no-overlap rule for appointments that are (or will
        # remain) scheduled — a cancelled/completed slot shouldn't block others.
        if doctor and date and start_time and end_time and status == Appointment.Status.SCHEDULED:
            AppointmentSchedulingService.validate_no_overlap(
                doctor=doctor,
                date=date,
                start_time=start_time,
                end_time=end_time,
                exclude_id=instance.pk if instance else None,
            )

        return attrs
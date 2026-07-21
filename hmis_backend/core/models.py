from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models


phone_validator = RegexValidator(
    regex=r"^\+?[0-9]{7,15}$",
    message="Phone number must contain 7 to 15 digits, optionally starting with '+'.",
)


class TimeStampedModel(models.Model):
    """Abstract base model that adds created/updated timestamps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Doctor(TimeStampedModel):
    class Specialization(models.TextChoices):
        GENERAL = "general", "General Practice"
        CARDIOLOGY = "cardiology", "Cardiology"
        DERMATOLOGY = "dermatology", "Dermatology"
        NEUROLOGY = "neurology", "Neurology"
        PEDIATRICS = "pediatrics", "Pediatrics"
        ORTHOPEDICS = "orthopedics", "Orthopedics"
        PSYCHIATRY = "psychiatry", "Psychiatry"
        OTHER = "other", "Other"

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    specialization = models.CharField(
        max_length=20, choices=Specialization.choices, default=Specialization.GENERAL
    )
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, validators=[phone_validator])
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"Dr. {self.first_name} {self.last_name} ({self.get_specialization_display()})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Patient(TimeStampedModel):
    class Gender(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "O", "Other"

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=Gender.choices)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, validators=[phone_validator])
    address = models.CharField(max_length=255, blank=True)
    assigned_doctor = models.ForeignKey(
        Doctor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patients",
    )

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Appointment(TimeStampedModel):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="appointments"
    )
    doctor = models.ForeignKey(
        Doctor, on_delete=models.CASCADE, related_name="appointments"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SCHEDULED
    )

    class Meta:
        ordering = ["-date", "-start_time"]
        indexes = [
            models.Index(fields=["doctor", "date"]),
        ]

    def __str__(self):
        return f"{self.patient} with {self.doctor} on {self.date} {self.start_time}-{self.end_time}"

    def clean(self):
        """
        Model-level guard (defense in depth). The primary overlap-checking
        business logic lives in services.py / the serializer, but this keeps
        the model itself safe if created directly (e.g. via shell, fixtures).
        """
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("start_time must be earlier than end_time.")

        overlapping = Appointment.objects.filter(
            doctor=self.doctor,
            date=self.date,
            status=self.Status.SCHEDULED,
        ).exclude(pk=self.pk)

        for appt in overlapping:
            if self.start_time < appt.end_time and appt.start_time < self.end_time:
                raise ValidationError(
                    f"Doctor already has an overlapping appointment "
                    f"({appt.start_time}-{appt.end_time}) on {self.date}."
                )
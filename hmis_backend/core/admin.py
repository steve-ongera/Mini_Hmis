from django.contrib import admin

from .models import Appointment, Doctor, Patient


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ("full_name", "specialization", "email", "phone", "is_active", "created_at")
    list_filter = ("specialization", "is_active")
    search_fields = ("first_name", "last_name", "email", "phone")
    ordering = ("last_name", "first_name")
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description="Name")
    def full_name(self, obj):
        return obj.full_name


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "gender",
        "date_of_birth",
        "email",
        "phone",
        "assigned_doctor",
        "created_at",
    )
    list_filter = ("gender", "assigned_doctor")
    search_fields = ("first_name", "last_name", "email", "phone")
    ordering = ("last_name", "first_name")
    autocomplete_fields = ("assigned_doctor",)
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description="Name")
    def full_name(self, obj):
        return obj.full_name


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "patient",
        "doctor",
        "date",
        "start_time",
        "end_time",
        "status",
        "reason",
    )
    list_filter = ("status", "doctor", "date")
    search_fields = (
        "patient__first_name",
        "patient__last_name",
        "doctor__first_name",
        "doctor__last_name",
        "reason",
    )
    ordering = ("-date", "-start_time")
    autocomplete_fields = ("patient", "doctor")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "date"
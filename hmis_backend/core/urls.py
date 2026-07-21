from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AppointmentViewSet, DashboardStatsView, DoctorViewSet, PatientViewSet

router = DefaultRouter()
router.register(r"doctors", DoctorViewSet, basename="doctor")
router.register(r"patients", PatientViewSet, basename="patient")
router.register(r"appointments", AppointmentViewSet, basename="appointment")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]
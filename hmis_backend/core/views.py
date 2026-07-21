from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import filters as drf_filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .filters import AppointmentFilter, DoctorFilter, PatientFilter
from .models import Appointment, Doctor, Patient
from .permissions import IsAdminOrReadOnly, IsAuthenticatedAndActive
from .serializers import (
    AppointmentSerializer,
    AssignDoctorSerializer,
    DoctorSerializer,
    PatientSerializer,
)
from .services import DashboardService, DoctorAssignmentService
from .utils import StandardResultsPagination, success_response


class DoctorViewSet(viewsets.ModelViewSet):
    """
    CRUD for doctors.
    list:    GET /api/doctors/?search=&specialization=&is_active=&ordering=
    create:  POST /api/doctors/            (admin only)
    retrieve: GET /api/doctors/{id}/
    update:  PUT/PATCH /api/doctors/{id}/  (admin only)
    delete:  DELETE /api/doctors/{id}/     (admin only)
    """

    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticatedAndActive, IsAdminOrReadOnly]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    filterset_class = DoctorFilter
    search_fields = ["first_name", "last_name", "email", "specialization"]
    ordering_fields = ["first_name", "last_name", "created_at"]

    @action(detail=True, methods=["get"], url_path="schedule")
    def schedule(self, request, pk=None):
        from .services import AppointmentSchedulingService

        doctor = self.get_object()
        date = request.query_params.get("date")
        appointments = AppointmentSchedulingService.get_doctor_schedule(doctor, date)
        serializer = AppointmentSerializer(appointments, many=True)
        return success_response(data=serializer.data, message="Doctor schedule retrieved.")


class PatientViewSet(viewsets.ModelViewSet):
    """
    CRUD for patients.
    list: GET /api/patients/?search=&gender=&assigned_doctor=&unassigned=&min_age=&max_age=&ordering=
    Extra action: PATCH /api/patients/{id}/assign-doctor/  {"doctor_id": 3}
    """

    queryset = Patient.objects.select_related("assigned_doctor").all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    filterset_class = PatientFilter
    search_fields = ["first_name", "last_name", "email", "phone"]
    ordering_fields = ["first_name", "last_name", "date_of_birth", "created_at"]

    @action(detail=True, methods=["patch"], url_path="assign-doctor")
    def assign_doctor(self, request, pk=None):
        patient = self.get_object()
        serializer = AssignDoctorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_patient = DoctorAssignmentService.assign_patient_to_doctor(
            patient, serializer.validated_data.get("doctor_id")
        )
        output = PatientSerializer(updated_patient)
        return success_response(
            data=output.data, message="Patient assignment updated.", status_code=status.HTTP_200_OK
        )


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    CRUD for appointments.
    list: GET /api/appointments/?doctor=&patient=&status=&date=&date_from=&date_to=&search=&ordering=
    Overlap validation happens in AppointmentSerializer.validate() via services.py.
    """

    queryset = Appointment.objects.select_related("patient", "doctor").all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    filterset_class = AppointmentFilter
    search_fields = ["reason", "patient__first_name", "patient__last_name", "doctor__last_name"]
    ordering_fields = ["date", "start_time", "created_at"]

    def perform_create(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)


class DashboardStatsView(APIView):
    """GET /api/dashboard/stats/ — summary counts for the frontend dashboard."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = DashboardService.get_stats()
        return success_response(data=stats, message="Dashboard stats retrieved.")
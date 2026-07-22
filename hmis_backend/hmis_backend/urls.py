from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from drf_yasg.views import get_schema_view
from drf_yasg import openapi


class LogoutView(APIView):
    """POST /api/auth/logout/ {"refresh": "..."} — blacklists the refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"success": True, "message": "Logged out."}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"success": False, "message": "Invalid or missing refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


schema_view = get_schema_view(
    openapi.Info(
        title="Hospital Management API",
        default_version="v1",
        description="RESTful API for managing patients, doctors, and appointments.",
    ),
    public=True,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # JWT auth
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="token_logout"),

    # App API (doctors, patients, appointments, dashboard)
    path("api/", include("core.urls")),

    # API docs
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="swagger-ui"),
]
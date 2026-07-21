from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import exception_handler


class StandardResultsPagination(PageNumberPagination):
    """Default pagination used across all list endpoints."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


def success_response(data=None, message="Success", status_code=200, extra=None):
    """Uniform success envelope for non-list endpoints (actions, dashboards, etc.)."""
    payload = {"success": True, "message": message, "data": data}
    if extra:
        payload.update(extra)
    return Response(payload, status=status_code)


def error_response(message="An error occurred", errors=None, status_code=400):
    """Uniform error envelope."""
    payload = {"success": False, "message": message}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler so all error responses share the
    same shape: {"success": false, "message": ..., "errors": {...}}
    """
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        message = "Validation failed" if response.status_code == 400 else "Request failed"
        response.data = {
            "success": False,
            "message": message,
            "errors": errors,
        }
    return response


def calculate_age(date_of_birth):
    from datetime import date

    today = date.today()
    return today.year - date_of_birth.year - (
        (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
    )
from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAuthenticatedAndActive(BasePermission):
    """Base permission: user must be authenticated and active."""

    message = "You must be logged in with an active account to perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)


class IsAdminOrReadOnly(BasePermission):
    """
    Any authenticated user can read (GET/HEAD/OPTIONS).
    Only staff/admin users can create, update, or delete.

    Useful for reference-style data (e.g. Doctors) that most staff should be
    able to view, but only admins should be able to modify.
    """

    message = "Only admin users can create, update, or delete this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff


class IsOwnerOrAdmin(BasePermission):
    """
    Generic object-level permission: allows access if the requesting user
    created/owns the object (via a `created_by` field) or is staff/admin.
    Falls back to allow-all if the model has no `created_by` field, so it's
    safe to attach even to models that don't track ownership yet.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        owner = getattr(obj, "created_by", None)
        if owner is None:
            return True
        return owner == request.user
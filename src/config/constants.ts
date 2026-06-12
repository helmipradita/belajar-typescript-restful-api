export const HTTP = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

export const MESSAGE = {
    OK: "OK",
    HEALTHY: "healthy",
    UNHEALTHY: "unhealthy",
    DEPENDENCY_UNAVAILABLE: "dependency unavailable",
    INTERNAL_SERVER_ERROR: "Internal server error",
    UNAUTHORIZED: "Unauthorized",
    USERNAME_EXISTS: "Username already exists",
    WRONG_CREDENTIALS: "Username or password is wrong",
    CONTACT_NOT_FOUND: "Contact not found",
    ADDRESS_NOT_FOUND: "Address is not found",
    RESOURCE_EXISTS: "Resource already exists",
    RESOURCE_NOT_FOUND: "Resource not found",
    DATABASE_ERROR: "Database request error",
    INVALID_REFRESH_TOKEN: "Invalid refresh token",
} as const;

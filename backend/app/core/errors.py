class AppError(Exception):
    """Base application exception."""
    pass

class ParserError(AppError):
    """Raised when parsing fails."""
    pass

class ConfigurationError(AppError):
    """Raised when configuration is invalid."""
    pass

class DbcDecodingError(AppError):
    """Raised when DBC decoding fails."""
    pass

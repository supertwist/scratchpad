import secrets
import string

alphabet = (
    string.ascii_uppercase
    + string.ascii_lowercase
    + string.digits
    + "!@#$%^&*()-_=+[]{}|;:,.<>?"
)

password = "".join(secrets.choice(alphabet) for _ in range(16))
print(password)

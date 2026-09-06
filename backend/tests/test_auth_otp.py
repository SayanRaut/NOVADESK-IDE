import pytest
from database.database import AsyncSessionLocal
from auth.services.user_service import create_user, verify_user_otp, authenticate_user, resend_user_otp
from auth.schemas import UserCreate
from auth.exceptions import UserCreationError, OTPVerificationError, UserUnverifiedError

@pytest.mark.asyncio
async def test_auth_otp_full_lifecycle():
    async with AsyncSessionLocal() as db:
        test_email = "ci_verifier_test@novadesk.io"
        
        # 1. Reject mismatched passwords
        with pytest.raises(UserCreationError):
            await create_user(db, UserCreate(
                email=test_email,
                display_name="Test Verifier",
                password="Password123!",
                confirm_password="DifferentPassword456!"
            ))

        # 2. Reject passwords shorter than 8 chars
        with pytest.raises(UserCreationError):
            await create_user(db, UserCreate(
                email=test_email,
                display_name="Test Verifier",
                password="short",
                confirm_password="short"
            ))

        # 3. Create unverified user and obtain 6-digit OTP
        user, otp = await create_user(db, UserCreate(
            email=test_email,
            display_name="Test Verifier",
            password="Password123!",
            confirm_password="Password123!"
        ))
        assert user.is_verified is False
        assert len(otp) == 6
        assert otp.isdigit()

        # 4. Attempt login while unverified -> should raise UserUnverifiedError
        with pytest.raises(UserUnverifiedError):
            await authenticate_user(db, test_email, "Password123!")

        # 5. Verify with invalid OTP -> should raise OTPVerificationError
        with pytest.raises(OTPVerificationError):
            await verify_user_otp(db, test_email, "000000")

        # 6. Verify with valid OTP -> should succeed and mark is_verified = True
        verified_user = await verify_user_otp(db, test_email, otp)
        assert verified_user.is_verified is True
        assert verified_user.otp_code is None

        # 7. Authenticate user now -> should succeed
        authed_user = await authenticate_user(db, test_email, "Password123!")
        assert authed_user is not None
        assert authed_user.email == test_email

        # 8. Clean up
        await db.delete(verified_user)
        await db.commit()

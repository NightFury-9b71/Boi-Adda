"""
Email service for sending verification and password reset emails
"""
from fastapi import BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, MessageType
from email_config import conf, FRONTEND_URL
from typing import Dict
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Initialize FastMail
fastmail = FastMail(conf)


async def send_verification_email_with_otp(
    email: str,
    otp: str,
    background_tasks: BackgroundTasks = None
) -> bool:
    """
    Send verification email with OTP code
    
    Args:
        email: Recipient email address
        otp: 6-digit OTP code
        background_tasks: Optional FastAPI background tasks
    
    Returns:
        bool: True if email sent successfully
    """
    try:
        template_body = {
            "Token": otp
        }
        
        message = MessageSchema(
            subject="ইমেইল যাচাই করুন - বই আড্ডা",
            recipients=[email],
            template_body=template_body,
            subtype=MessageType.html,
        )
        
        if background_tasks:
            background_tasks.add_task(fastmail.send_message, message, template_name="verify_email.html")
        else:
            await fastmail.send_message(message, template_name="verify_email.html")
        
        logger.info(f"Verification OTP email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification OTP email to {email}: {str(e)}")
        return False


async def send_verification_email_with_link(
    email: str,
    token: str,
    background_tasks: BackgroundTasks = None
) -> bool:
    """
    Send verification email with magic link
    
    Args:
        email: Recipient email address
        token: Verification token for magic link
        background_tasks: Optional FastAPI background tasks
    
    Returns:
        bool: True if email sent successfully
    """
    try:
        verification_url = f"{FRONTEND_URL}/verify-email?token={token}&email={email}"
        
        template_body = {
            "ConfirmationURL": verification_url
        }
        
        message = MessageSchema(
            subject="ইমেইল যাচাই করুন - বই আড্ডা",
            recipients=[email],
            template_body=template_body,
            subtype=MessageType.html,
        )
        
        if background_tasks:
            background_tasks.add_task(fastmail.send_message, message, template_name="magic_link.html")
        else:
            await fastmail.send_message(message, template_name="magic_link.html")
        
        logger.info(f"Verification magic link email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification magic link email to {email}: {str(e)}")
        return False


async def send_password_reset_email_with_otp(
    email: str,
    otp: str,
    background_tasks: BackgroundTasks = None
) -> bool:
    """
    Send password reset email with OTP code
    
    Args:
        email: Recipient email address
        otp: 6-digit OTP code
        background_tasks: Optional FastAPI background tasks
    
    Returns:
        bool: True if email sent successfully
    """
    try:
        template_body = {
            "Token": otp,
            "Type": "reset"
        }
        
        message = MessageSchema(
            subject="পাসওয়ার্ড রিসেট করুন - বই আড্ডা",
            recipients=[email],
            template_body=template_body,
            subtype=MessageType.html,
        )
        
        if background_tasks:
            background_tasks.add_task(fastmail.send_message, message, template_name="reset_password.html")
        else:
            await fastmail.send_message(message, template_name="reset_password.html")
        
        logger.info(f"Password reset OTP email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset OTP email to {email}: {str(e)}")
        return False


async def send_password_reset_email_with_link(
    email: str,
    token: str,
    background_tasks: BackgroundTasks = None
) -> bool:
    """
    Send password reset email with magic link
    
    Args:
        email: Recipient email address
        token: Reset token for magic link
        background_tasks: Optional FastAPI background tasks
    
    Returns:
        bool: True if email sent successfully
    """
    try:
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}&email={email}"
        
        template_body = {
            "ConfirmationURL": reset_url,
            "Type": "reset"
        }
        
        message = MessageSchema(
            subject="পাসওয়ার্ড রিসেট করুন - বই আড্ডা",
            recipients=[email],
            template_body=template_body,
            subtype=MessageType.html,
        )
        
        if background_tasks:
            background_tasks.add_task(fastmail.send_message, message, template_name="reset_password.html")
        else:
            await fastmail.send_message(message, template_name="reset_password.html")
        
        logger.info(f"Password reset magic link email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset magic link email to {email}: {str(e)}")
        return False


async def send_both_verification_methods(
    email: str,
    otp: str,
    token: str,
    background_tasks: BackgroundTasks = None
) -> Dict[str, bool]:
    """
    Send both OTP and magic link for email verification
    
    Args:
        email: Recipient email address
        otp: 6-digit OTP code
        token: Verification token for magic link
        background_tasks: Optional FastAPI background tasks
    
    Returns:
        Dict with success status for each method
    """
    otp_sent = await send_verification_email_with_otp(email, otp, background_tasks)
    link_sent = await send_verification_email_with_link(email, token, background_tasks)
    
    return {
        "otp_sent": otp_sent,
        "link_sent": link_sent
    }


async def send_both_password_reset_methods(
    email: str,
    otp: str,
    token: str,
    background_tasks: BackgroundTasks = None
) -> Dict[str, bool]:
    """
    Send both OTP and magic link for password reset
    
    Args:
        email: Recipient email address
        otp: 6-digit OTP code
        token: Reset token for magic link
        background_tasks: Optional FastAPI background tasks
    
    Returns:
        Dict with success status for each method
    """
    otp_sent = await send_password_reset_email_with_otp(email, otp, background_tasks)
    link_sent = await send_password_reset_email_with_link(email, token, background_tasks)
    
    return {
        "otp_sent": otp_sent,
        "link_sent": link_sent
    }

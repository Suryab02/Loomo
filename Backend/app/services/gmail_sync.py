import imaplib
import email
from email.header import decode_header
import os
from app.services.job_parser import parse_job_text
from app.utils.security import security_gateway

def get_gmail_jobs():
    """
    Connects to Gmail via IMAP and parses job applications from the 'Loomo' label.
    """
    user_email = os.getenv("GMAIL_USER")
    app_password = os.getenv("GMAIL_APP_PASSWORD")
    target_label = os.getenv("GMAIL_LABEL", "Loomo")

    if not user_email or not app_password:
        return {"error": "Gmail credentials (GMAIL_USER, GMAIL_APP_PASSWORD) not configured in .env."}

    try:
        # 1. Connect and Login
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user_email, app_password)
        
        # 2. Select the specific Label/Folder
        status, messages = mail.select(target_label)
        if status != 'OK':
            return {"error": f"Gmail Label '{target_label}' not found."}

        # 3. Search for all emails
        status, data = mail.search(None, "ALL")
        if status != 'OK':
            return {"error": "Failed to search folder."}

        job_ids = data[0].split()
        jobs_found = []

        # 4. Fetch the last 10 emails
        for job_id in job_ids[-10:]:
            status, data = mail.fetch(job_id, "(RFC822)")
            if status != 'OK': continue
            
            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            subject, encoding = decode_header(msg["Subject"])[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding if encoding else "utf-8", errors="ignore")
            
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode(errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode(errors="ignore")

            # 5. Redact & Parse
            context_text = security_gateway(f"HEADER INFO: Subject: {subject}\n\nBODY TEXT: {body[:5000]}")
            parsed_job = parse_job_text(context_text)
            parsed_job["subject_preview"] = subject
            jobs_found.append(parsed_job)

        mail.logout()
        return jobs_found
    except Exception as e:
        return {"error": f"IMAP Error: {str(e)}"}

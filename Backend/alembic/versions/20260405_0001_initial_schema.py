"""Initial schema

Revision ID: 20260405_0001
Revises:
Create Date: 2026-04-05 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260405_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("current_role", sa.String(), nullable=True),
        sa.Column("years_experience", sa.String(), nullable=True),
        sa.Column("current_company", sa.String(), nullable=True),
        sa.Column("skills", sa.String(), nullable=True),
        sa.Column("target_role", sa.String(), nullable=True),
        sa.Column("target_location", sa.String(), nullable=True),
        sa.Column("work_type", sa.String(), nullable=True),
        sa.Column("expected_ctc", sa.String(), nullable=True),
        sa.Column("notice_period", sa.String(), nullable=True),
        sa.Column("platforms", sa.String(), nullable=True),
        sa.Column("gemini_api_key", sa.String(), nullable=True),
        sa.Column("onboarding_complete", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("company", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("job_url", sa.String(), nullable=True),
        sa.Column("job_description", sa.Text(), nullable=True),
        sa.Column("salary_range", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("platform", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("match_score", sa.Integer(), nullable=True),
        sa.Column("matched_skills", sa.String(), nullable=True),
        sa.Column("missing_skills", sa.String(), nullable=True),
        sa.Column("applied_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("follow_up_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("follow_up_snooze_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("follow_up_contacted", sa.Boolean(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("contact_name", sa.String(), nullable=True),
        sa.Column("contact_email", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f("ix_jobs_id"), "jobs", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_jobs_id"), table_name="jobs")
    op.drop_table("jobs")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

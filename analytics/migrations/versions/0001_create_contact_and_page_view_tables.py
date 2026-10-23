"""create contact and page view tables

Revision ID: 0001
Revises: 
Create Date: 2026-10-23 18:46:10.856389
"""

import sqlalchemy as sa
from alembic import op

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('analytics_contact_message',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
    sa.Column('email_sent', sa.Boolean(), nullable=False, server_default=sa.false()),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analytics_contact_message_created_at'), 'analytics_contact_message', ['created_at'], unique=False)
    op.create_table('analytics_page_view',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('path', sa.String(length=300), nullable=False),
    sa.Column('referrer_host', sa.String(length=255), nullable=False, server_default=''),
    sa.Column('visitor_hash', sa.String(length=64), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analytics_page_view_created_at'), 'analytics_page_view', ['created_at'], unique=False)
    op.create_index(op.f('ix_analytics_page_view_visitor_hash'), 'analytics_page_view', ['visitor_hash'], unique=False)
    op.create_index('ix_page_view_created_path', 'analytics_page_view', ['created_at', 'path'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_page_view_created_path', table_name='analytics_page_view')
    op.drop_index(op.f('ix_analytics_page_view_visitor_hash'), table_name='analytics_page_view')
    op.drop_index(op.f('ix_analytics_page_view_created_at'), table_name='analytics_page_view')
    op.drop_table('analytics_page_view')
    op.drop_index(op.f('ix_analytics_contact_message_created_at'), table_name='analytics_contact_message')
    op.drop_table('analytics_contact_message')

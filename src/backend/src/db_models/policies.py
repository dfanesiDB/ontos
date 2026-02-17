import uuid
from sqlalchemy import Column, String, Text, Boolean, TIMESTAMP, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.common.database import Base


class PolicyDb(Base):
    """Policy: formal, reusable rule for data access, quality, retention, or usage."""
    __tablename__ = "policies"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    policy_type = Column(String, nullable=False, index=True)  # access_privacy, data_quality, retention_lifecycle, usage_purpose, custom
    status = Column(String, nullable=False, default="draft", index=True)  # draft, active, deprecated, archived
    content = Column(Text, nullable=True)  # The actual policy text / rules body
    enforcement_level = Column(String, nullable=False, default="advisory")  # advisory, mandatory, automated
    version = Column(String, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)  # Additional structured metadata
    is_system = Column(Boolean, nullable=False, default=False)  # Built-in vs user-defined

    created_by = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    attachments = relationship("PolicyAttachmentDb", back_populates="policy", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PolicyDb(id={self.id}, name='{self.name}', type='{self.policy_type}')>"


class PolicyAttachmentDb(Base):
    """Links a policy to a target object (domain, product, contract, asset, attribute, etc.)."""
    __tablename__ = "policy_attachments"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(PG_UUID(as_uuid=True), ForeignKey("policies.id"), nullable=False, index=True)
    target_type = Column(String, nullable=False, index=True)  # domain, data_product, data_contract, asset, attribute, delivery_channel
    target_id = Column(String, nullable=False, index=True)  # ID of the target object
    target_name = Column(String, nullable=True)  # Cached display name for convenience
    notes = Column(Text, nullable=True)  # Optional context for this specific attachment

    created_by = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    policy = relationship("PolicyDb", back_populates="attachments")

    __table_args__ = (
        UniqueConstraint("policy_id", "target_type", "target_id", name="uq_policy_attachment"),
    )

    def __repr__(self):
        return f"<PolicyAttachmentDb(id={self.id}, policy_id='{self.policy_id}', target='{self.target_type}:{self.target_id}')>"

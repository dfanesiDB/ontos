from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class PolicyType(str, Enum):
    ACCESS_PRIVACY = "access_privacy"
    DATA_QUALITY = "data_quality"
    RETENTION_LIFECYCLE = "retention_lifecycle"
    USAGE_PURPOSE = "usage_purpose"
    CUSTOM = "custom"


class PolicyStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


class EnforcementLevel(str, Enum):
    ADVISORY = "advisory"
    MANDATORY = "mandatory"
    AUTOMATED = "automated"


# --- Policy Attachment Models ---
class PolicyAttachmentBase(BaseModel):
    target_type: str = Field(..., description="Type of the target object (domain, data_product, data_contract, asset, attribute, delivery_channel)")
    target_id: str = Field(..., description="ID of the target object")
    target_name: Optional[str] = Field(None, description="Display name of the target (cached)")
    notes: Optional[str] = Field(None, description="Optional context for this specific attachment")


class PolicyAttachmentCreate(PolicyAttachmentBase):
    pass


class PolicyAttachment(PolicyAttachmentBase):
    id: UUID
    policy_id: UUID
    created_by: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Policy Models ---
class PolicyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Unique policy name")
    description: Optional[str] = Field(None, description="Human-readable description")
    policy_type: PolicyType = Field(..., description="Category of the policy")
    status: PolicyStatus = Field(PolicyStatus.DRAFT, description="Lifecycle status")
    content: Optional[str] = Field(None, description="The actual policy text / rules body")
    enforcement_level: EnforcementLevel = Field(EnforcementLevel.ADVISORY, description="How strictly the policy is enforced")
    version: Optional[str] = Field(None, description="Version string, e.g., v1.0")
    metadata_: Optional[Dict[str, Any]] = Field(None, alias="metadata", description="Additional structured metadata")
    is_system: bool = Field(False, description="Whether this is a built-in policy")


class PolicyCreate(PolicyBase):
    attachments: Optional[List[PolicyAttachmentCreate]] = Field(None, description="Initial policy attachments")


class PolicyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    policy_type: Optional[PolicyType] = None
    status: Optional[PolicyStatus] = None
    content: Optional[str] = None
    enforcement_level: Optional[EnforcementLevel] = None
    version: Optional[str] = None
    metadata_: Optional[Dict[str, Any]] = Field(None, alias="metadata")
    is_system: Optional[bool] = None


class PolicyRead(PolicyBase):
    id: UUID
    attachments: List[PolicyAttachment] = Field(default_factory=list)
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class PolicySummary(BaseModel):
    """Lightweight representation for lists and dropdowns."""
    id: UUID
    name: str
    policy_type: PolicyType
    status: PolicyStatus
    enforcement_level: EnforcementLevel
    attachment_count: int = 0

    model_config = {"from_attributes": True}

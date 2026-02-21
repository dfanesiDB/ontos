"""Pydantic models for the cross-tier entity relationship system."""

from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class EntityRelationshipCreate(BaseModel):
    """Request body for creating a relationship between two entities."""
    source_type: str = Field(..., description="Entity type of the source (e.g. 'DataProduct', 'Dataset')")
    source_id: str = Field(..., description="UUID of the source entity")
    target_type: str = Field(..., description="Entity type of the target")
    target_id: str = Field(..., description="UUID of the target entity")
    relationship_type: str = Field(..., description="Ontology relationship IRI or local name (e.g. 'hasDataset')")
    properties: Optional[Dict[str, Any]] = Field(None, description="Optional relationship metadata")


class EntityRelationshipRead(BaseModel):
    """Response model for a single entity relationship."""
    id: UUID
    source_type: str
    source_id: str
    target_type: str
    target_id: str
    relationship_type: str
    properties: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    created_at: datetime

    # Resolved display info (populated by the manager)
    source_name: Optional[str] = Field(None, description="Resolved name of the source entity")
    target_name: Optional[str] = Field(None, description="Resolved name of the target entity")
    relationship_label: Optional[str] = Field(None, description="Human-readable label from the ontology")

    model_config = {"from_attributes": True}


class EntityRelationshipQuery(BaseModel):
    """Query parameters for filtering relationships."""
    source_type: Optional[str] = None
    source_id: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    relationship_type: Optional[str] = None


class EntityRelationshipSummary(BaseModel):
    """Summary of all relationships for a single entity (both directions)."""
    entity_type: str
    entity_id: str
    outgoing: List[EntityRelationshipRead] = Field(default_factory=list)
    incoming: List[EntityRelationshipRead] = Field(default_factory=list)
    total: int = 0

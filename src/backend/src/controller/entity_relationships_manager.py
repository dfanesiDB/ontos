"""Manager for cross-tier entity relationships.

Validates relationship types against the ontology before persisting,
and resolves entity names for display.
"""

from __future__ import annotations

from typing import List, Optional, TYPE_CHECKING
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.db_models.entity_relationships import EntityRelationshipDb
from src.repositories.entity_relationships_repository import entity_relationship_repo
from src.models.entity_relationships import (
    EntityRelationshipCreate,
    EntityRelationshipRead,
    EntityRelationshipSummary,
)
from src.common.errors import ConflictError, NotFoundError
from src.common.logging import get_logger

if TYPE_CHECKING:
    from src.controller.ontology_schema_manager import OntologySchemaManager

logger = get_logger(__name__)

ONTOS_NS = "http://ontos.app/ontology#"


class EntityRelationshipsManager:
    """Manages cross-tier entity relationships with ontology validation."""

    def __init__(self, ontology_schema_manager: "OntologySchemaManager"):
        self._osm = ontology_schema_manager
        logger.info("EntityRelationshipsManager initialized")

    # ------------------------------------------------------------------
    # Ontology validation
    # ------------------------------------------------------------------

    def _normalize_relationship_type(self, relationship_type: str) -> str:
        """Accept both local names ('hasDataset') and full IRIs."""
        if relationship_type.startswith("http://") or relationship_type.startswith("https://"):
            return relationship_type
        return f"{ONTOS_NS}{relationship_type}"

    def _normalize_entity_type(self, entity_type: str) -> str:
        """Accept both local names ('DataProduct') and full IRIs."""
        if entity_type.startswith("http://") or entity_type.startswith("https://"):
            return entity_type
        return f"{ONTOS_NS}{entity_type}"

    def _validate_relationship(
        self, source_type: str, target_type: str, relationship_type: str
    ) -> Optional[str]:
        """Validate that the ontology allows this (source_type, rel, target_type) triple.

        Returns the human-readable relationship label if valid, or raises ValueError.
        """
        source_iri = self._normalize_entity_type(source_type)
        rel_iri = self._normalize_relationship_type(relationship_type)

        rels = self._osm.get_relationships(source_iri)

        for r in rels.outgoing:
            if r.property_iri == rel_iri:
                target_iri = self._normalize_entity_type(target_type)
                if r.target_type_iri == target_iri:
                    return r.label
                # Check if target is a subclass of the declared range
                target_ancestors = set()
                from rdflib import URIRef, RDFS
                for ancestor in self._osm._graph.objects(URIRef(target_iri), RDFS.subClassOf):
                    target_ancestors.add(str(ancestor))
                if r.target_type_iri in target_ancestors:
                    return r.label

        raise ValueError(
            f"Ontology does not allow relationship '{relationship_type}' "
            f"from '{source_type}' to '{target_type}'"
        )

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create_relationship(
        self,
        db: Session,
        rel_in: EntityRelationshipCreate,
        current_user_id: str,
    ) -> EntityRelationshipRead:
        """Create a new entity relationship, validated against the ontology."""
        rel_label = self._validate_relationship(
            rel_in.source_type, rel_in.target_type, rel_in.relationship_type
        )

        existing = entity_relationship_repo.find_existing(
            db,
            source_type=rel_in.source_type,
            source_id=rel_in.source_id,
            target_type=rel_in.target_type,
            target_id=rel_in.target_id,
            relationship_type=rel_in.relationship_type,
        )
        if existing:
            raise ConflictError(
                f"Relationship already exists: {rel_in.source_type}:{rel_in.source_id} "
                f"--[{rel_in.relationship_type}]--> "
                f"{rel_in.target_type}:{rel_in.target_id}"
            )

        db_obj = EntityRelationshipDb(
            source_type=rel_in.source_type,
            source_id=rel_in.source_id,
            target_type=rel_in.target_type,
            target_id=rel_in.target_id,
            relationship_type=rel_in.relationship_type,
            properties=rel_in.properties,
            created_by=current_user_id,
        )

        try:
            db.add(db_obj)
            db.flush()
            db.refresh(db_obj)
        except IntegrityError as e:
            db.rollback()
            raise ConflictError(f"Relationship already exists (constraint violation): {e}")

        return self._to_read(db_obj, relationship_label=rel_label)

    def delete_relationship(self, db: Session, rel_id: UUID) -> None:
        """Delete a relationship by ID."""
        obj = entity_relationship_repo.get(db, rel_id)
        if not obj:
            raise NotFoundError(f"Entity relationship not found: {rel_id}")
        entity_relationship_repo.remove(db, id=rel_id)

    def get_relationship(self, db: Session, rel_id: UUID) -> EntityRelationshipRead:
        """Get a single relationship by ID."""
        obj = entity_relationship_repo.get(db, rel_id)
        if not obj:
            raise NotFoundError(f"Entity relationship not found: {rel_id}")
        return self._to_read(obj)

    # ------------------------------------------------------------------
    # Query methods
    # ------------------------------------------------------------------

    def get_outgoing(
        self, db: Session,
        source_type: str, source_id: str,
        relationship_type: Optional[str] = None,
    ) -> List[EntityRelationshipRead]:
        if relationship_type:
            rows = entity_relationship_repo.get_by_source_and_type(
                db, source_type=source_type, source_id=source_id,
                relationship_type=relationship_type,
            )
        else:
            rows = entity_relationship_repo.get_by_source(
                db, source_type=source_type, source_id=source_id,
            )
        return [self._to_read(r) for r in rows]

    def get_incoming(
        self, db: Session,
        target_type: str, target_id: str,
        relationship_type: Optional[str] = None,
    ) -> List[EntityRelationshipRead]:
        if relationship_type:
            rows = entity_relationship_repo.get_by_target_and_type(
                db, target_type=target_type, target_id=target_id,
                relationship_type=relationship_type,
            )
        else:
            rows = entity_relationship_repo.get_by_target(
                db, target_type=target_type, target_id=target_id,
            )
        return [self._to_read(r) for r in rows]

    def get_all_for_entity(
        self, db: Session, entity_type: str, entity_id: str
    ) -> EntityRelationshipSummary:
        """All relationships for an entity, split into outgoing/incoming."""
        rows = entity_relationship_repo.get_for_entity(
            db, entity_type=entity_type, entity_id=entity_id,
        )

        outgoing = []
        incoming = []
        for r in rows:
            read = self._to_read(r)
            if r.source_type == entity_type and r.source_id == entity_id:
                outgoing.append(read)
            else:
                incoming.append(read)

        return EntityRelationshipSummary(
            entity_type=entity_type,
            entity_id=entity_id,
            outgoing=outgoing,
            incoming=incoming,
            total=len(outgoing) + len(incoming),
        )

    def query_relationships(
        self, db: Session, *,
        source_type: Optional[str] = None, source_id: Optional[str] = None,
        target_type: Optional[str] = None, target_id: Optional[str] = None,
        relationship_type: Optional[str] = None,
        skip: int = 0, limit: int = 100,
    ) -> List[EntityRelationshipRead]:
        rows = entity_relationship_repo.query_filtered(
            db,
            source_type=source_type, source_id=source_id,
            target_type=target_type, target_id=target_id,
            relationship_type=relationship_type,
            skip=skip, limit=limit,
        )
        return [self._to_read(r) for r in rows]

    # ------------------------------------------------------------------
    # Mapping
    # ------------------------------------------------------------------

    def _to_read(
        self, db_obj: EntityRelationshipDb, relationship_label: Optional[str] = None
    ) -> EntityRelationshipRead:
        if not relationship_label:
            rel_iri = self._normalize_relationship_type(db_obj.relationship_type)
            try:
                from rdflib import URIRef, RDFS
                label_val = self._osm._graph.value(URIRef(rel_iri), RDFS.label)
                relationship_label = str(label_val) if label_val else db_obj.relationship_type
            except Exception:
                relationship_label = db_obj.relationship_type

        return EntityRelationshipRead(
            id=db_obj.id,
            source_type=db_obj.source_type,
            source_id=db_obj.source_id,
            target_type=db_obj.target_type,
            target_id=db_obj.target_id,
            relationship_type=db_obj.relationship_type,
            properties=db_obj.properties,
            created_by=db_obj.created_by,
            created_at=db_obj.created_at,
            relationship_label=relationship_label,
        )

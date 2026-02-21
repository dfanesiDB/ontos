from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.repositories.assets_repository import asset_type_repo, asset_repo, asset_relationship_repo
from src.models.assets import (
    AssetTypeCreate, AssetTypeUpdate, AssetTypeRead, AssetTypeSummary,
    AssetCreate, AssetUpdate, AssetRead, AssetSummary,
    AssetRelationshipCreate, AssetRelationshipRead,
)
from src.db_models.assets import AssetTypeDb, AssetDb, AssetRelationshipDb
from src.common.errors import ConflictError, NotFoundError, ValidationError
from src.common.logging import get_logger

logger = get_logger(__name__)

ONTOS_NS = "http://ontos.app/ontology#"


class AssetsManager:
    def __init__(self, ontology_schema_manager=None):
        self._type_repo = asset_type_repo
        self._asset_repo = asset_repo
        self._rel_repo = asset_relationship_repo
        self._ontology = ontology_schema_manager
        logger.debug("AssetsManager initialized (ontology validation=%s).", self._ontology is not None)

    # --- Helpers ---

    def _type_to_read(self, db: Session, db_type: AssetTypeDb) -> AssetTypeRead:
        """Convert DB asset type to read model with asset count."""
        read = AssetTypeRead.model_validate(db_type)
        read.asset_count = self._type_repo.get_asset_count(db, db_type.id)
        return read

    def _type_to_summary(self, db_type: AssetTypeDb) -> AssetTypeSummary:
        return AssetTypeSummary.model_validate(db_type)

    def _asset_to_read(self, db_asset: AssetDb) -> AssetRead:
        read = AssetRead.model_validate(db_asset)
        if db_asset.asset_type:
            read.asset_type_name = db_asset.asset_type.name
        # Merge source and target relationships into a single list
        rels = []
        if db_asset.source_relationships:
            rels.extend([AssetRelationshipRead.model_validate(r) for r in db_asset.source_relationships])
        if db_asset.target_relationships:
            rels.extend([AssetRelationshipRead.model_validate(r) for r in db_asset.target_relationships])
        read.relationships = rels
        return read

    def _asset_to_summary(self, db_asset: AssetDb) -> AssetSummary:
        summary = AssetSummary.model_validate(db_asset)
        if db_asset.asset_type:
            summary.asset_type_name = db_asset.asset_type.name
        return summary

    # --- JSON Schema validation ---

    def _validate_properties(self, db: Session, asset_type_id: UUID, properties: Optional[Dict[str, Any]]) -> None:
        """Validate asset properties against ontology-derived JSON Schema."""
        if not self._ontology or not properties:
            return

        db_type = self._type_repo.get(db, asset_type_id)
        if not db_type:
            return

        type_iri = f"{ONTOS_NS}{db_type.name}"
        try:
            schema_def = self._ontology.get_entity_type_schema(type_iri)
        except Exception:
            return

        json_schema = schema_def.json_schema
        if not json_schema:
            return

        try:
            import jsonschema
            jsonschema.validate(instance=properties, schema=json_schema)
        except jsonschema.ValidationError as e:
            raise ValidationError(
                f"Asset properties validation failed for type '{db_type.name}': {e.message}"
            )

    # --- Asset Type CRUD ---

    def create_asset_type(self, db: Session, *, type_in: AssetTypeCreate, current_user_id: str) -> AssetTypeRead:
        """Creates a new asset type."""
        existing = self._type_repo.get_by_name(db, name=type_in.name)
        if existing:
            raise ConflictError(f"Asset type '{type_in.name}' already exists.")

        data = type_in.model_dump()
        data["created_by"] = current_user_id
        db_type = AssetTypeDb(**data)

        try:
            db.add(db_type)
            db.flush()
            db.refresh(db_type)
            logger.info(f"Created asset type '{db_type.name}' (id: {db_type.id})")
            return self._type_to_read(db, db_type)
        except IntegrityError as e:
            db.rollback()
            if "unique constraint" in str(e).lower():
                raise ConflictError(f"Asset type '{type_in.name}' already exists.")
            raise

    def get_asset_type(self, db: Session, type_id: UUID) -> Optional[AssetTypeRead]:
        db_type = self._type_repo.get(db, type_id)
        if not db_type:
            return None
        return self._type_to_read(db, db_type)

    def get_all_asset_types(
        self, db: Session, *, skip: int = 0, limit: int = 100,
        category: Optional[str] = None, status: Optional[str] = None
    ) -> List[AssetTypeRead]:
        db_types = self._type_repo.get_multi_filtered(db, skip=skip, limit=limit, category=category, status=status)
        return [self._type_to_read(db, t) for t in db_types]

    def get_asset_types_summary(self, db: Session) -> List[AssetTypeSummary]:
        db_types = self._type_repo.get_multi_filtered(db, limit=1000)
        return [self._type_to_summary(t) for t in db_types]

    def update_asset_type(self, db: Session, *, type_id: UUID, type_in: AssetTypeUpdate, current_user_id: str) -> AssetTypeRead:
        db_type = self._type_repo.get(db, type_id)
        if not db_type:
            raise NotFoundError(f"Asset type '{type_id}' not found.")

        if type_in.name and type_in.name != db_type.name:
            existing = self._type_repo.get_by_name(db, name=type_in.name)
            if existing:
                raise ConflictError(f"Asset type '{type_in.name}' already exists.")

        update_data = type_in.model_dump(exclude_unset=True)
        try:
            updated = self._type_repo.update(db=db, db_obj=db_type, obj_in=update_data)
            db.flush()
            db.refresh(updated)
            logger.info(f"Updated asset type '{updated.name}' (id: {type_id})")
            return self._type_to_read(db, updated)
        except IntegrityError as e:
            db.rollback()
            if "unique constraint" in str(e).lower():
                raise ConflictError(f"Asset type name conflict.")
            raise

    def delete_asset_type(self, db: Session, *, type_id: UUID) -> AssetTypeRead:
        db_type = self._type_repo.get(db, type_id)
        if not db_type:
            raise NotFoundError(f"Asset type '{type_id}' not found.")

        # Check for existing assets of this type
        count = self._type_repo.get_asset_count(db, type_id)
        if count > 0:
            raise ConflictError(f"Cannot delete asset type '{db_type.name}': {count} assets still reference it.")

        read = self._type_to_read(db, db_type)
        self._type_repo.remove(db=db, id=type_id)
        logger.info(f"Deleted asset type '{read.name}' (id: {type_id})")
        return read

    # --- Asset CRUD ---

    def create_asset(self, db: Session, *, asset_in: AssetCreate, current_user_id: str) -> AssetRead:
        """Creates a new asset."""
        db_type = self._type_repo.get(db, asset_in.asset_type_id)
        if not db_type:
            raise NotFoundError(f"Asset type '{asset_in.asset_type_id}' not found.")

        self._validate_properties(db, asset_in.asset_type_id, asset_in.properties)

        data = asset_in.model_dump()
        data["created_by"] = current_user_id
        db_asset = AssetDb(**data)

        try:
            db.add(db_asset)
            db.flush()
            db.refresh(db_asset)
            # Reload with relationships
            db_asset = self._asset_repo.get_with_relationships(db, db_asset.id)
            logger.info(f"Created asset '{db_asset.name}' (id: {db_asset.id})")
            return self._asset_to_read(db_asset)
        except IntegrityError as e:
            db.rollback()
            if "unique constraint" in str(e).lower():
                raise ConflictError(f"Asset identity conflict.")
            raise

    def get_asset(self, db: Session, asset_id: UUID) -> Optional[AssetRead]:
        db_asset = self._asset_repo.get_with_relationships(db, asset_id)
        if not db_asset:
            return None
        return self._asset_to_read(db_asset)

    def get_all_assets(
        self, db: Session, *, skip: int = 0, limit: int = 100,
        asset_type_id: Optional[UUID] = None, platform: Optional[str] = None,
        domain_id: Optional[str] = None, status: Optional[str] = None
    ) -> List[AssetSummary]:
        """Gets all assets as summaries (lightweight)."""
        db_assets = self._asset_repo.get_multi_filtered(
            db, skip=skip, limit=limit,
            asset_type_id=asset_type_id, platform=platform,
            domain_id=domain_id, status=status,
        )
        return [self._asset_to_summary(a) for a in db_assets]

    def update_asset(self, db: Session, *, asset_id: UUID, asset_in: AssetUpdate, current_user_id: str) -> AssetRead:
        db_asset = self._asset_repo.get(db, asset_id)
        if not db_asset:
            raise NotFoundError(f"Asset '{asset_id}' not found.")

        if asset_in.asset_type_id and asset_in.asset_type_id != db_asset.asset_type_id:
            db_type = self._type_repo.get(db, asset_in.asset_type_id)
            if not db_type:
                raise NotFoundError(f"Asset type '{asset_in.asset_type_id}' not found.")

        effective_type_id = asset_in.asset_type_id or db_asset.asset_type_id
        if asset_in.properties is not None:
            self._validate_properties(db, effective_type_id, asset_in.properties)

        update_data = asset_in.model_dump(exclude_unset=True)
        try:
            updated = self._asset_repo.update(db=db, db_obj=db_asset, obj_in=update_data)
            db.flush()
            db.refresh(updated)
            updated = self._asset_repo.get_with_relationships(db, updated.id)
            logger.info(f"Updated asset '{updated.name}' (id: {asset_id})")
            return self._asset_to_read(updated)
        except IntegrityError as e:
            db.rollback()
            if "unique constraint" in str(e).lower():
                raise ConflictError("Asset identity conflict.")
            raise

    def delete_asset(self, db: Session, *, asset_id: UUID) -> AssetRead:
        db_asset = self._asset_repo.get_with_relationships(db, asset_id)
        if not db_asset:
            raise NotFoundError(f"Asset '{asset_id}' not found.")

        read = self._asset_to_read(db_asset)
        self._asset_repo.remove(db=db, id=asset_id)
        logger.info(f"Deleted asset '{read.name}' (id: {asset_id})")
        return read

    # --- Relationship operations ---

    def add_relationship(
        self, db: Session, *, rel_in: AssetRelationshipCreate, current_user_id: str
    ) -> AssetRelationshipRead:
        """Creates a relationship between two assets."""
        # Validate both assets exist
        src = self._asset_repo.get(db, rel_in.source_asset_id)
        if not src:
            raise NotFoundError(f"Source asset '{rel_in.source_asset_id}' not found.")
        tgt = self._asset_repo.get(db, rel_in.target_asset_id)
        if not tgt:
            raise NotFoundError(f"Target asset '{rel_in.target_asset_id}' not found.")

        existing = self._rel_repo.find_existing(
            db,
            source_asset_id=rel_in.source_asset_id,
            target_asset_id=rel_in.target_asset_id,
            relationship_type=rel_in.relationship_type,
        )
        if existing:
            raise ConflictError(f"Relationship already exists.")

        db_rel = AssetRelationshipDb(
            source_asset_id=rel_in.source_asset_id,
            target_asset_id=rel_in.target_asset_id,
            relationship_type=rel_in.relationship_type,
            properties=rel_in.properties,
            created_by=current_user_id,
        )
        db.add(db_rel)
        db.flush()
        db.refresh(db_rel)
        logger.info(f"Created relationship {rel_in.relationship_type} between {rel_in.source_asset_id} -> {rel_in.target_asset_id}")
        return AssetRelationshipRead.model_validate(db_rel)

    def remove_relationship(self, db: Session, *, relationship_id: UUID) -> bool:
        result = self._rel_repo.remove(db=db, id=relationship_id)
        if not result:
            raise NotFoundError(f"Relationship '{relationship_id}' not found.")
        logger.info(f"Removed relationship {relationship_id}")
        return True


# Singleton instance
assets_manager = AssetsManager()

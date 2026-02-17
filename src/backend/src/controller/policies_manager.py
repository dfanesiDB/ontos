from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.repositories.policies_repository import policy_repo, policy_attachment_repo
from src.models.policies import (
    PolicyCreate, PolicyUpdate, PolicyRead, PolicySummary,
    PolicyAttachmentCreate, PolicyAttachment,
)
from src.db_models.policies import PolicyDb, PolicyAttachmentDb
from src.common.errors import ConflictError, NotFoundError
from src.common.logging import get_logger

logger = get_logger(__name__)


class PoliciesManager:
    def __init__(self):
        self._policy_repo = policy_repo
        self._attachment_repo = policy_attachment_repo
        logger.debug("PoliciesManager initialized.")

    def _convert_to_read(self, db_policy: PolicyDb) -> PolicyRead:
        """Convert DB model to read model.
        Note: We build a dict explicitly because SQLAlchemy's base model has a
        class-level 'metadata' attribute (MetaData) that collides with our
        column named 'metadata' (aliased as metadata_ in the ORM model).
        """
        return PolicyRead(
            id=db_policy.id,
            name=db_policy.name,
            description=db_policy.description,
            policy_type=db_policy.policy_type,
            status=db_policy.status,
            content=db_policy.content,
            enforcement_level=db_policy.enforcement_level,
            version=db_policy.version,
            metadata=db_policy.metadata_,
            is_system=db_policy.is_system,
            attachments=[
                PolicyAttachment.model_validate(a) for a in (db_policy.attachments or [])
            ],
            created_by=db_policy.created_by,
            created_at=db_policy.created_at,
            updated_at=db_policy.updated_at,
        )

    def _convert_to_summary(self, db_policy: PolicyDb) -> PolicySummary:
        """Convert DB model to summary model."""
        return PolicySummary(
            id=db_policy.id,
            name=db_policy.name,
            policy_type=db_policy.policy_type,
            status=db_policy.status,
            enforcement_level=db_policy.enforcement_level,
            attachment_count=len(db_policy.attachments) if db_policy.attachments else 0,
        )

    # --- Policy CRUD ---

    def create_policy(self, db: Session, *, policy_in: PolicyCreate, current_user_id: str) -> PolicyRead:
        """Creates a new policy with optional attachments."""
        logger.debug(f"Creating policy: {policy_in.name}")

        existing = self._policy_repo.get_by_name(db, name=policy_in.name)
        if existing:
            raise ConflictError(f"Policy with name '{policy_in.name}' already exists.")

        # Separate attachments from policy data
        attachments_data = policy_in.attachments or []
        policy_data = policy_in.model_dump(exclude={"attachments"}, by_alias=True)
        policy_data["created_by"] = current_user_id

        db_policy = PolicyDb(**policy_data)

        try:
            db.add(db_policy)
            db.flush()
            db.refresh(db_policy)

            # Create attachments
            for att in attachments_data:
                db_att = PolicyAttachmentDb(
                    policy_id=db_policy.id,
                    target_type=att.target_type,
                    target_id=att.target_id,
                    target_name=att.target_name,
                    notes=att.notes,
                    created_by=current_user_id,
                )
                db.add(db_att)

            db.flush()
            db.refresh(db_policy)
            logger.info(f"Created policy '{db_policy.name}' (id: {db_policy.id})")
            return self._convert_to_read(db_policy)
        except IntegrityError as e:
            db.rollback()
            if "unique constraint" in str(e).lower():
                raise ConflictError(f"Policy with name '{policy_in.name}' already exists.")
            raise

    def get_policy(self, db: Session, policy_id: UUID) -> Optional[PolicyRead]:
        """Gets a policy by ID with attachments."""
        db_policy = self._policy_repo.get_with_attachments(db, policy_id)
        if not db_policy:
            return None
        return self._convert_to_read(db_policy)

    def get_all_policies(
        self, db: Session, *, skip: int = 0, limit: int = 100,
        policy_type: Optional[str] = None, status: Optional[str] = None
    ) -> List[PolicyRead]:
        """Gets all policies with optional filters."""
        db_policies = self._policy_repo.get_multi_with_attachments(
            db, skip=skip, limit=limit, policy_type=policy_type, status=status
        )
        return [self._convert_to_read(p) for p in db_policies]

    def get_policies_summary(
        self, db: Session, *, policy_type: Optional[str] = None, status: Optional[str] = None
    ) -> List[PolicySummary]:
        """Gets a summary list for dropdowns/selection."""
        db_policies = self._policy_repo.get_multi_with_attachments(
            db, limit=1000, policy_type=policy_type, status=status
        )
        return [self._convert_to_summary(p) for p in db_policies]

    def update_policy(self, db: Session, *, policy_id: UUID, policy_in: PolicyUpdate, current_user_id: str) -> PolicyRead:
        """Updates an existing policy."""
        db_policy = self._policy_repo.get_with_attachments(db, policy_id)
        if not db_policy:
            raise NotFoundError(f"Policy with id '{policy_id}' not found.")

        if policy_in.name and policy_in.name != db_policy.name:
            existing = self._policy_repo.get_by_name(db, name=policy_in.name)
            if existing:
                raise ConflictError(f"Policy with name '{policy_in.name}' already exists.")

        update_data = policy_in.model_dump(exclude_unset=True, by_alias=True)

        try:
            updated = self._policy_repo.update(db=db, db_obj=db_policy, obj_in=update_data)
            db.flush()
            db.refresh(updated)
            logger.info(f"Updated policy '{updated.name}' (id: {policy_id})")
            return self._convert_to_read(updated)
        except IntegrityError as e:
            db.rollback()
            if "unique constraint" in str(e).lower():
                raise ConflictError(f"Policy name conflict.")
            raise

    def delete_policy(self, db: Session, *, policy_id: UUID) -> PolicyRead:
        """Deletes a policy and all its attachments."""
        db_policy = self._policy_repo.get_with_attachments(db, policy_id)
        if not db_policy:
            raise NotFoundError(f"Policy with id '{policy_id}' not found.")

        read_model = self._convert_to_read(db_policy)
        self._policy_repo.remove(db=db, id=policy_id)
        logger.info(f"Deleted policy '{read_model.name}' (id: {policy_id})")
        return read_model

    # --- Attachment operations ---

    def add_attachment(
        self, db: Session, *, policy_id: UUID, attachment_in: PolicyAttachmentCreate, current_user_id: str
    ) -> PolicyAttachment:
        """Adds a target attachment to a policy."""
        db_policy = self._policy_repo.get(db, policy_id)
        if not db_policy:
            raise NotFoundError(f"Policy with id '{policy_id}' not found.")

        existing = self._attachment_repo.find_existing(
            db, policy_id=policy_id,
            target_type=attachment_in.target_type,
            target_id=attachment_in.target_id,
        )
        if existing:
            raise ConflictError(
                f"Policy '{db_policy.name}' is already attached to {attachment_in.target_type}:{attachment_in.target_id}."
            )

        db_att = PolicyAttachmentDb(
            policy_id=policy_id,
            target_type=attachment_in.target_type,
            target_id=attachment_in.target_id,
            target_name=attachment_in.target_name,
            notes=attachment_in.notes,
            created_by=current_user_id,
        )
        db.add(db_att)
        db.flush()
        db.refresh(db_att)
        logger.info(f"Attached policy '{db_policy.name}' to {attachment_in.target_type}:{attachment_in.target_id}")
        return PolicyAttachment.model_validate(db_att)

    def remove_attachment(self, db: Session, *, policy_id: UUID, attachment_id: UUID) -> bool:
        """Removes a policy attachment."""
        db_att = self._attachment_repo.get(db, attachment_id)
        if not db_att or db_att.policy_id != policy_id:
            raise NotFoundError(f"Attachment '{attachment_id}' not found for policy '{policy_id}'.")

        self._attachment_repo.remove(db=db, id=attachment_id)
        logger.info(f"Removed attachment {attachment_id} from policy {policy_id}")
        return True

    def get_policies_for_target(self, db: Session, *, target_type: str, target_id: str) -> List[PolicyRead]:
        """Gets all policies attached to a specific target."""
        db_policies = self._policy_repo.get_policies_for_target(
            db, target_type=target_type, target_id=target_id
        )
        return [self._convert_to_read(p) for p in db_policies]


# Singleton instance
policies_manager = PoliciesManager()

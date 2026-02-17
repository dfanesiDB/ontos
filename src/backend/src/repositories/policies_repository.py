from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import SQLAlchemyError

from src.common.repository import CRUDBase
from src.db_models.policies import PolicyDb, PolicyAttachmentDb
from src.models.policies import PolicyCreate, PolicyUpdate, PolicyAttachmentCreate
from src.common.logging import get_logger

logger = get_logger(__name__)


class PolicyRepository(CRUDBase[PolicyDb, PolicyCreate, PolicyUpdate]):
    def __init__(self):
        super().__init__(PolicyDb)
        logger.info("PolicyRepository initialized.")

    def get_with_attachments(self, db: Session, id: UUID) -> Optional[PolicyDb]:
        """Gets a single policy by ID, eager loading attachments."""
        try:
            return (
                db.query(self.model)
                .options(selectinload(self.model.attachments))
                .filter(self.model.id == id)
                .first()
            )
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching policy with attachments by id {id}: {e}", exc_info=True)
            db.rollback()
            raise

    def get_multi_with_attachments(
        self, db: Session, *, skip: int = 0, limit: int = 100,
        policy_type: Optional[str] = None, status: Optional[str] = None
    ) -> List[PolicyDb]:
        """Gets multiple policies, eager loading attachments."""
        try:
            query = (
                db.query(self.model)
                .options(selectinload(self.model.attachments))
                .order_by(self.model.name)
            )
            if policy_type:
                query = query.filter(self.model.policy_type == policy_type)
            if status:
                query = query.filter(self.model.status == status)
            return query.offset(skip).limit(limit).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching multiple policies: {e}", exc_info=True)
            db.rollback()
            raise

    def get_by_name(self, db: Session, *, name: str) -> Optional[PolicyDb]:
        """Gets a policy by name."""
        try:
            return db.query(self.model).filter(self.model.name == name).first()
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching policy by name {name}: {e}", exc_info=True)
            db.rollback()
            raise

    def get_policies_for_target(
        self, db: Session, *, target_type: str, target_id: str
    ) -> List[PolicyDb]:
        """Gets all policies attached to a specific target."""
        try:
            return (
                db.query(self.model)
                .options(selectinload(self.model.attachments))
                .join(PolicyAttachmentDb)
                .filter(
                    PolicyAttachmentDb.target_type == target_type,
                    PolicyAttachmentDb.target_id == target_id,
                )
                .order_by(self.model.name)
                .all()
            )
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching policies for target {target_type}:{target_id}: {e}", exc_info=True)
            db.rollback()
            raise


class PolicyAttachmentRepository(CRUDBase[PolicyAttachmentDb, PolicyAttachmentCreate, PolicyAttachmentCreate]):
    def __init__(self):
        super().__init__(PolicyAttachmentDb)
        logger.info("PolicyAttachmentRepository initialized.")

    def get_by_policy(self, db: Session, *, policy_id: UUID) -> List[PolicyAttachmentDb]:
        """Gets all attachments for a specific policy."""
        try:
            return (
                db.query(self.model)
                .filter(self.model.policy_id == policy_id)
                .order_by(self.model.target_type, self.model.target_name)
                .all()
            )
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching attachments for policy {policy_id}: {e}", exc_info=True)
            db.rollback()
            raise

    def get_by_target(self, db: Session, *, target_type: str, target_id: str) -> List[PolicyAttachmentDb]:
        """Gets all attachments for a specific target."""
        try:
            return (
                db.query(self.model)
                .filter(
                    self.model.target_type == target_type,
                    self.model.target_id == target_id,
                )
                .all()
            )
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching attachments for target {target_type}:{target_id}: {e}", exc_info=True)
            db.rollback()
            raise

    def find_existing(self, db: Session, *, policy_id: UUID, target_type: str, target_id: str) -> Optional[PolicyAttachmentDb]:
        """Checks if an attachment already exists."""
        try:
            return (
                db.query(self.model)
                .filter(
                    self.model.policy_id == policy_id,
                    self.model.target_type == target_type,
                    self.model.target_id == target_id,
                )
                .first()
            )
        except SQLAlchemyError as e:
            logger.error(f"Database error checking existing attachment: {e}", exc_info=True)
            db.rollback()
            raise


# Singleton instances
policy_repo = PolicyRepository()
policy_attachment_repo = PolicyAttachmentRepository()

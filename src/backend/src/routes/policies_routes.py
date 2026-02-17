from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request

from src.models.policies import (
    PolicyCreate, PolicyUpdate, PolicyRead, PolicySummary,
    PolicyAttachmentCreate, PolicyAttachment,
)
from src.controller.policies_manager import policies_manager
from src.common.authorization import PermissionChecker
from src.common.features import FeatureAccessLevel
from src.common.dependencies import (
    DBSessionDep,
    CurrentUserDep,
    AuditManagerDep,
    AuditCurrentUserDep,
)
from src.common.errors import NotFoundError, ConflictError
from src.common.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/policies", tags=["Policies"])
FEATURE_ID = "policies"


def get_policies_manager():
    return policies_manager


# --- Policy CRUD ---

@router.post(
    "",
    response_model=PolicyRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(PermissionChecker(FEATURE_ID, FeatureAccessLevel.READ_WRITE))],
)
def create_policy(
    request: Request,
    policy_in: PolicyCreate,
    db: DBSessionDep,
    audit_manager: AuditManagerDep,
    current_user: AuditCurrentUserDep,
    manager=Depends(get_policies_manager),
):
    """Creates a new policy."""
    success = False
    details = {"params": {"name": policy_in.name, "type": policy_in.policy_type}}
    created_id = None
    try:
        result = manager.create_policy(db=db, policy_in=policy_in, current_user_id=current_user.email)
        success = True
        created_id = str(result.id)
        return result
    except ConflictError as e:
        details["exception"] = {"type": "ConflictError", "message": str(e)}
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.exception("Failed to create policy '%s'", policy_in.name)
        details["exception"] = {"type": type(e).__name__, "message": str(e)}
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create policy")
    finally:
        if created_id:
            details["created_resource_id"] = created_id
        audit_manager.log_action(
            db=db, username=current_user.username,
            ip_address=request.client.host if request.client else None,
            feature=FEATURE_ID, action="CREATE", success=success, details=details,
        )


@router.get(
    "",
    response_model=List[PolicyRead],
    dependencies=[Depends(PermissionChecker(FEATURE_ID, FeatureAccessLevel.READ_ONLY))],
)
def get_all_policies(
    db: DBSessionDep,
    manager=Depends(get_policies_manager),
    skip: int = 0,
    limit: int = 100,
    policy_type: Optional[str] = Query(None),
    policy_status: Optional[str] = Query(None, alias="status"),
):
    """Lists all policies with optional filters."""
    return manager.get_all_policies(db=db, skip=skip, limit=limit, policy_type=policy_type, status=policy_status)


@router.get(
    "/summary",
    response_model=List[PolicySummary],
    dependencies=[Depends(PermissionChecker(FEATURE_ID, FeatureAccessLevel.READ_ONLY))],
)
def get_policies_summary(
    db: DBSessionDep,
    manager=Depends(get_policies_manager),
    policy_type: Optional[str] = Query(None),
    policy_status: Optional[str] = Query(None, alias="status"),
):
    """Gets a summary list for dropdowns."""
    return manager.get_policies_summary(db=db, policy_type=policy_type, status=policy_status)


@router.get(
    "/by-target/{target_type}/{target_id}",
    response_model=List[PolicyRead],
    dependencies=[Depends(PermissionChecker(FEATURE_ID, FeatureAccessLevel.READ_ONLY))],
)
def get_policies_for_target(
    target_type: str,
    target_id: str,
    db: DBSessionDep,
    manager=Depends(get_policies_manager),
):
    """Gets all policies attached to a specific target object."""
    return manager.get_policies_for_target(db=db, target_type=target_type, target_id=target_id)


@router.get(
    "/{policy_id}",
    response_model=PolicyRead,
    dependencies=[Depends(PermissionChecker(FEATURE_ID, FeatureAccessLevel.READ_ONLY))],
)
def get_policy(
    policy_id: UUID,
    db: DBSessionDep,
    manager=Depends(get_policies_manager),
):
    """Gets a specific policy by ID."""
    result = manager.get_policy(db=db, policy_id=policy_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Policy '{policy_id}' not found")
    return result


@router.put(
    "/{policy_id}",
    response_model=PolicyRead,
    dependencies=[Depends(PermissionChecker(FEATURE_ID, FeatureAccessLevel.READ_WRITE))],
)
def update_policy(
    policy_id: UUID,
    request: Request,
    policy_in: PolicyUpdate,
    db: DBSessionDep,
    audit_manager: AuditManagerDep,
    current_user: AuditCurrentUserDep,
    manager=Depends(get_policies_manager),
):
    """Updates an existing policy."""
    success = False
    details = {"params": {"policy_id": str(policy_id)}}
    try:
        result = manager.update_policy(db=db, policy_id=policy_id, policy_in=policy_in, current_user_id=current_user.email)
        success = True
        return result
    except NotFoundError as e:
        details["exception"] = {"type": "NotFoundError", "message": str(e)}
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        details["exception"] = {"type": "ConflictError", "message": str(e)}
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.exception("Failed to update policy %s", policy_id)
        details["exception"] = {"type": type(e).__name__, "message": str(e)}
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update policy")
    finally:
        if success:
            details["updated_resource_id"] = str(policy_id)
        audit_manager.log_action(
            db=db, username=current_user.username,
            ip_address=request.client.host if request.client else None,
            feature=FEATURE_ID, action="UPDATE", success=success, details=details,
        )


@router.delete(
    "/{policy_id}",
    response_model=PolicyRead,
    dependencies=[Depends(PermissionChecker(FEATURE_ID, FeatureAccessLevel.ADMIN))],
)
def delete_policy(
    policy_id: UUID,
    request: Request,
    db: DBSessionDep,
    audit_manager: AuditManagerDep,
    current_user: AuditCurrentUserDep,
    manager=Depends(get_policies_manager),
):
    """Deletes a policy. Requires Admin."""
    success = False
    details = {"params": {"policy_id": str(policy_id)}}
    try:
        result = manager.delete_policy(db=db, policy_id=policy_id)
        success = True
        return result
    except NotFoundError as e:
        details["exception"] = {"type": "NotFoundError", "message": str(e)}
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception("Failed to delete policy %s", policy_id)
        details["exception"] = {"type": type(e).__name__, "message": str(e)}
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete policy")
    finally:
        if success:
            details["deleted_resource_id"] = str(policy_id)
        audit_manager.log_action(
            db=db, username=current_user.username,
            ip_address=request.client.host if request.client else None,
            feature=FEATURE_ID, action="DELETE", success=success, details=details,
        )


# --- Attachment operations ---

@router.post(
    "/{policy_id}/attachments",
    response_model=PolicyAttachment,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(PermissionChecker(FEATURE_ID, FeatureAccessLevel.READ_WRITE))],
)
def add_policy_attachment(
    policy_id: UUID,
    request: Request,
    attachment_in: PolicyAttachmentCreate,
    db: DBSessionDep,
    audit_manager: AuditManagerDep,
    current_user: AuditCurrentUserDep,
    manager=Depends(get_policies_manager),
):
    """Attaches a policy to a target object."""
    success = False
    details = {"params": {"policy_id": str(policy_id), "target": f"{attachment_in.target_type}:{attachment_in.target_id}"}}
    try:
        result = manager.add_attachment(
            db=db, policy_id=policy_id, attachment_in=attachment_in, current_user_id=current_user.email
        )
        success = True
        return result
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.exception("Failed to add policy attachment")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add attachment")
    finally:
        audit_manager.log_action(
            db=db, username=current_user.username,
            ip_address=request.client.host if request.client else None,
            feature=FEATURE_ID, action="ADD_ATTACHMENT", success=success, details=details,
        )


@router.delete(
    "/{policy_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(PermissionChecker(FEATURE_ID, FeatureAccessLevel.READ_WRITE))],
)
def remove_policy_attachment(
    policy_id: UUID,
    attachment_id: UUID,
    request: Request,
    db: DBSessionDep,
    audit_manager: AuditManagerDep,
    current_user: AuditCurrentUserDep,
    manager=Depends(get_policies_manager),
):
    """Removes a policy attachment."""
    success = False
    details = {"params": {"policy_id": str(policy_id), "attachment_id": str(attachment_id)}}
    try:
        manager.remove_attachment(db=db, policy_id=policy_id, attachment_id=attachment_id)
        success = True
        return None
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception("Failed to remove policy attachment")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove attachment")
    finally:
        audit_manager.log_action(
            db=db, username=current_user.username,
            ip_address=request.client.host if request.client else None,
            feature=FEATURE_ID, action="REMOVE_ATTACHMENT", success=success, details=details,
        )


def register_routes(app):
    app.include_router(router)
    logger.info("Policy routes registered with prefix /api/policies")

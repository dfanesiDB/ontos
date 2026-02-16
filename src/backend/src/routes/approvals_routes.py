from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, Field

from src.common.dependencies import DBSessionDep, CurrentUserDep
from src.common.authorization import ApprovalChecker, PermissionChecker
from src.common.features import FeatureAccessLevel
from src.controller.approvals_manager import ApprovalsManager
from src.controller.workflows_manager import WorkflowsManager
from src.controller.agreement_wizard_manager import AgreementWizardManager
from src.models.process_workflows import WorkflowType
from src.common.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Approvals"])


def get_approvals_manager(request: Request) -> ApprovalsManager:
    """Dependency provider for ApprovalsManager."""
    manager = getattr(request.app.state, 'approvals_manager', None)
    if not manager:
        # Create on-demand if not in app.state
        logger.warning("ApprovalsManager not found in app.state, creating new instance")
        manager = ApprovalsManager()
    return manager


def get_workflows_manager(db: DBSessionDep) -> WorkflowsManager:
    """Get WorkflowsManager instance."""
    return WorkflowsManager(db)


def get_agreement_wizard_manager(
    db: DBSessionDep,
    request: Request,
) -> AgreementWizardManager:
    """Get AgreementWizardManager with optional PDF storage path from app.state."""
    storage_base_path = getattr(request.app.state, 'agreement_pdf_volume_path', None)
    return AgreementWizardManager(db, storage_base_path=storage_base_path)


# Name of the default workflow used when an approver responds to an approval request (replaces hardcoded dialog).
DEFAULT_APPROVAL_RESPONSE_WORKFLOW_NAME = "Approval response"
# Name of the default workflow used for subscription / contract signing (Subscribe uses this with completion_action=subscribe).
DEFAULT_SUBSCRIPTION_WORKFLOW_NAME = "Subscription"


@router.get('/approvals/queue')
async def get_approvals_queue(
    db: DBSessionDep,
    current_user: CurrentUserDep,
    manager: ApprovalsManager = Depends(get_approvals_manager),
    _: bool = Depends(PermissionChecker('data-contracts', FeatureAccessLevel.READ_ONLY)),
):
    """Get all items awaiting approval (contracts, products, etc.)."""
    try:
        return manager.get_approvals_queue(db)
    except Exception as e:
        logger.exception("Failed to build approvals queue")
        raise HTTPException(status_code=500, detail="Failed to build approvals queue")


@router.get('/approvals/default-response-workflow')
async def get_default_response_workflow(
    db: DBSessionDep,
    workflows_manager: WorkflowsManager = Depends(get_workflows_manager),
    _: bool = Depends(PermissionChecker('data-contracts', FeatureAccessLevel.READ_ONLY)),
) -> Dict[str, Any]:
    """Return the default approval workflow used for approval response UI (replaces hardcoded dialog).
    Returns the workflow named 'Approval response' (workflow_type=approval) with its first step config
    so the frontend can render 'Enter a reason' + Approve/Reject.
    """
    from src.repositories.process_workflows_repository import process_workflow_repo
    db_workflow = process_workflow_repo.get_by_name(db, DEFAULT_APPROVAL_RESPONSE_WORKFLOW_NAME)
    if not db_workflow:
        raise HTTPException(
            status_code=404,
            detail="Default approval response workflow not found. Load default workflows from Settings.",
        )
    if getattr(db_workflow, 'workflow_type', 'process') != WorkflowType.APPROVAL.value:
        raise HTTPException(
            status_code=400,
            detail="Default approval response workflow must have workflow_type=approval.",
        )
    workflow = workflows_manager.get_workflow(db_workflow.id)
    if not workflow or not workflow.steps:
        raise HTTPException(status_code=404, detail="Default approval response workflow has no steps.")
    first_step = workflow.steps[0]
    return {
        "workflow_id": workflow.id,
        "workflow_name": workflow.name,
        "step_id": first_step.step_id,
        "step_name": first_step.name,
        "step_type": first_step.step_type.value,
        "config": first_step.config or {},
    }


@router.get('/approvals/default-subscription-workflow')
async def get_default_subscription_workflow(
    db: DBSessionDep,
    workflows_manager: WorkflowsManager = Depends(get_workflows_manager),
    _: bool = Depends(PermissionChecker('data-contracts', FeatureAccessLevel.READ_ONLY)),
) -> Dict[str, Any]:
    """Return the default approval workflow for subscription/contract signing (used with completion_action=subscribe)."""
    from src.repositories.process_workflows_repository import process_workflow_repo
    db_workflow = process_workflow_repo.get_by_name(db, DEFAULT_SUBSCRIPTION_WORKFLOW_NAME)
    if not db_workflow:
        # Try loading default workflows from YAML once (e.g. if startup load was skipped or failed)
        try:
            workflows_manager.load_from_yaml()
            db.commit()
            db_workflow = process_workflow_repo.get_by_name(db, DEFAULT_SUBSCRIPTION_WORKFLOW_NAME)
        except Exception as e:
            logger.warning("Failed to load default workflows for subscription: %s", e)
        if not db_workflow:
            raise HTTPException(
                status_code=404,
                detail="Default subscription workflow not found. Load default workflows from Settings.",
            )
    workflow = workflows_manager.get_workflow(db_workflow.id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Default subscription workflow not found.")
    steps = []
    for s in (workflow.steps or []):
        steps.append({
            "step_id": s.step_id,
            "name": s.name,
            "step_type": s.step_type.value,
            "config": s.config or {},
        })
    return {
        "workflow_id": workflow.id,
        "workflow_name": workflow.name,
        "description": workflow.description,
        "steps": steps,
    }


# --- Agreement wizard (approval workflows) ---

class CreateSessionBody(BaseModel):
    """Body for POST /api/approvals/sessions."""
    workflow_id: str = Field(..., description="Approval workflow ID")
    entity_type: str = Field(..., description="Entity type (e.g. data_contract, data_product, dataset)")
    entity_id: str = Field(..., description="Entity ID")
    completion_action: Optional[str] = Field(None, description="Action after complete, e.g. 'subscribe'")


class SubmitStepBody(BaseModel):
    """Body for POST /api/approvals/sessions/{id}/steps."""
    step_id: str = Field(..., description="Step ID being submitted")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Step payload (e.g. reason, acceptances)")


class MyApprovalSessionResponse(BaseModel):
    """One approval/subscription session for the current user."""
    id: str
    workflow_id: str
    entity_type: str
    entity_id: str
    entity_name: Optional[str] = None
    completion_action: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MyApprovalSessionsList(BaseModel):
    """List of approval/subscription sessions for the current user."""
    sessions: List[MyApprovalSessionResponse]
    total: int


@router.get('/approvals/my-sessions', response_model=MyApprovalSessionsList)
async def get_my_approval_sessions(
    db: DBSessionDep,
    current_user: CurrentUserDep,
    agreement_wizard_manager: AgreementWizardManager = Depends(get_agreement_wizard_manager),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List approval/subscription sessions created by the current user (in_progress, completed, abandoned)."""
    if not current_user or not current_user.email:
        raise HTTPException(status_code=401, detail="Authentication required")
    sessions, total = agreement_wizard_manager.get_my_sessions(
        current_user.email, limit=limit, offset=offset
    )
    return MyApprovalSessionsList(
        sessions=[MyApprovalSessionResponse.model_validate(s) for s in sessions],
        total=total,
    )


@router.get('/approvals/workflows')
async def list_approval_workflows(
    db: DBSessionDep,
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    workflows_manager: WorkflowsManager = Depends(get_workflows_manager),
    _: bool = Depends(PermissionChecker('data-contracts', FeatureAccessLevel.READ_ONLY)),
) -> List[Dict[str, Any]]:
    """List approval workflows only (workflow_type=approval). Optionally filter by entity."""
    workflows = workflows_manager.list_workflows(workflow_type=WorkflowType.APPROVAL)
    result = []
    for w in workflows:
        steps = []
        for s in (w.steps or []):
            steps.append({
                "step_id": s.step_id,
                "name": s.name,
                "step_type": s.step_type.value,
                "config": s.config or {},
            })
        result.append({
            "id": w.id,
            "name": w.name,
            "description": w.description,
            "steps": steps,
        })
    return result


@router.post('/approvals/sessions')
async def create_approval_session(
    db: DBSessionDep,
    body: CreateSessionBody,
    current_user: CurrentUserDep,
    wizard_manager: AgreementWizardManager = Depends(get_agreement_wizard_manager),
    _: bool = Depends(PermissionChecker('data-contracts', FeatureAccessLevel.READ_WRITE)),
) -> Dict[str, Any]:
    """Create a new agreement wizard session; returns session_id and first step."""
    try:
        created_by = current_user.email if current_user else None
        return wizard_manager.create_session(
            workflow_id=body.workflow_id,
            entity_type=body.entity_type,
            entity_id=body.entity_id,
            completion_action=body.completion_action,
            created_by=created_by,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/approvals/sessions/{session_id}')
async def get_approval_session(
    session_id: str,
    db: DBSessionDep,
    wizard_manager: AgreementWizardManager = Depends(get_agreement_wizard_manager),
    _: bool = Depends(PermissionChecker('data-contracts', FeatureAccessLevel.READ_ONLY)),
) -> Dict[str, Any]:
    """Get current step and step_results (for Back/refresh)."""
    data = wizard_manager.get_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found or not in progress")
    return data


@router.post('/approvals/sessions/{session_id}/steps')
async def submit_approval_step(
    session_id: str,
    db: DBSessionDep,
    body: SubmitStepBody,
    current_user: CurrentUserDep,
    wizard_manager: AgreementWizardManager = Depends(get_agreement_wizard_manager),
    _: bool = Depends(PermissionChecker('data-contracts', FeatureAccessLevel.READ_WRITE)),
) -> Dict[str, Any]:
    """Submit step payload; returns next step or { complete: true, agreement_id, pdf_storage_path? }."""
    try:
        created_by = current_user.email if current_user else None
        return wizard_manager.submit_step(
            session_id=session_id,
            step_id=body.step_id,
            payload=body.payload,
            created_by=created_by,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/approvals/sessions/{session_id}/abort')
async def abort_approval_session(
    session_id: str,
    db: DBSessionDep,
    wizard_manager: AgreementWizardManager = Depends(get_agreement_wizard_manager),
    _: bool = Depends(PermissionChecker('data-contracts', FeatureAccessLevel.READ_WRITE)),
) -> Dict[str, Any]:
    """Mark session as abandoned."""
    ok = wizard_manager.abort_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found or not in progress")
    return {"session_id": session_id, "status": "abandoned"}


def register_routes(app):
    app.include_router(router)
    logger.info("Approvals routes registered")



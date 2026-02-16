import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, XCircle, Loader2 } from 'lucide-react';
import { RelativeDate } from '@/components/common/relative-date';
import { ListViewSkeleton } from '@/components/common/list-view-skeleton';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import useBreadcrumbStore from '@/stores/breadcrumb-store';

interface AccessGrantRequestItem {
  id: string;
  requester_email: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string | null;
  requested_duration_days: number;
  permission_level: string;
  reason?: string | null;
  status: string;
  created_at: string;
  handled_at?: string | null;
  handled_by?: string | null;
  admin_message?: string | null;
}

interface MyRequestsResponse {
  requests: AccessGrantRequestItem[];
  total: number;
}

interface ApprovalSessionItem {
  id: string;
  workflow_id: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string | null;
  completion_action?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
}

interface MyApprovalSessionsResponse {
  sessions: ApprovalSessionItem[];
  total: number;
}

/** Unified row for table: access requests + approval/subscription sessions */
type RequestRow =
  | { source: 'access'; id: string; entityTypeKey: string; entityName: string; typeLabelKey: string; status: string; statusI18nKey: string; created_at: string; handled_at?: string | null; canCancel: boolean; accessReq: AccessGrantRequestItem }
  | { source: 'approval'; id: string; entityTypeKey: string; entityName: string; typeLabelKey: string; status: string; statusI18nKey: string; created_at: string; handled_at?: string | null; canCancel: false; session: ApprovalSessionItem };

function entityTypeToLabelKey(entityType: string): string {
  const key = entityType?.toLowerCase?.() ?? '';
  if (key === 'data_product') return 'myRequests.entityTypeDataProduct';
  if (key === 'dataset') return 'myRequests.entityTypeDataset';
  if (key === 'data_contract') return 'myRequests.entityTypeDataContract';
  return 'myRequests.entityTypeDataProduct'; // fallback for unknown types
}

/** Path to entity detail page, or null if type not supported. */
function getEntityDetailPath(entityType: string, entityId: string): string | null {
  const key = entityType?.toLowerCase?.() ?? '';
  if (!entityId) return null;
  if (key === 'data_product') return `/data-products/${entityId}`;
  if (key === 'dataset') return `/datasets/${entityId}`;
  if (key === 'data_contract') return `/data-contracts/${entityId}`;
  return null;
}

const STATUS_I18N: Record<string, string> = {
  pending: 'myRequests.statusPending',
  approved: 'myRequests.statusApproved',
  denied: 'myRequests.statusDenied',
  cancelled: 'myRequests.statusCancelled',
  expired: 'myRequests.statusExpired',
  in_progress: 'myRequests.statusInProgress',
  completed: 'myRequests.statusCompleted',
  abandoned: 'myRequests.statusAbandoned',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  denied: 'destructive',
  cancelled: 'outline',
  expired: 'outline',
  in_progress: 'secondary',
  completed: 'default',
  abandoned: 'outline',
};

export default function MyRequests() {
  const { t } = useTranslation('home');
  const api = useApi();
  const { toast } = useToast();
  const setStaticSegments = useBreadcrumbStore((state) => state.setStaticSegments);

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const mergeAndSort = useCallback((accessRequests: AccessGrantRequestItem[], sessions: ApprovalSessionItem[]): RequestRow[] => {
    const accessRows: RequestRow[] = accessRequests.map((req) => ({
      source: 'access' as const,
      id: req.id,
      entityTypeKey: entityTypeToLabelKey(req.entity_type),
      entityName: req.entity_name || req.entity_id,
      typeLabelKey: 'myRequests.typeAccess',
      status: req.status,
      statusI18nKey: STATUS_I18N[req.status] ?? req.status,
      created_at: req.created_at,
      handled_at: req.handled_at ?? undefined,
      canCancel: req.status === 'pending',
      accessReq: req,
    }));
    const approvalRows: RequestRow[] = sessions.map((s) => ({
      source: 'approval' as const,
      id: s.id,
      entityTypeKey: entityTypeToLabelKey(s.entity_type),
      entityName: s.entity_name ?? s.entity_id,
      typeLabelKey: s.completion_action === 'subscribe' ? 'myRequests.typeSubscription' : 'myRequests.typeApproval',
      status: s.status,
      statusI18nKey: STATUS_I18N[s.status] ?? s.status,
      created_at: s.created_at,
      handled_at: s.status !== 'in_progress' ? (s.updated_at ?? s.created_at) : undefined,
      canCancel: false,
      session: s,
    }));
    const merged = [...accessRows, ...approvalRows];
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return merged;
  }, []);

  // Fetch access requests only. (Approval/subscription sessions are not shown in Requests; completed agreements may be added later.)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const accessResp = await fetch('/api/access-grants/my-requests');
        if (cancelled) return;
        if (!accessResp.ok) {
          const errText = await accessResp.text();
          setError(errText || `HTTP ${accessResp.status}`);
          setRows([]);
          return;
        }
        const accessData: MyRequestsResponse = await accessResp.json();
        if (cancelled) return;
        setRows(mergeAndSort(accessData?.requests ?? [], []));
      } catch (e) {
        if (cancelled) return;
        console.warn('Failed to fetch my requests:', e);
        setError(e instanceof Error ? e.message : 'Failed to load');
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [mergeAndSort]);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const accessResp = await api.get<MyRequestsResponse>('/api/access-grants/my-requests');
      setRows(mergeAndSort(accessResp.data?.requests ?? [], []));
    } catch (e) {
      console.warn('Failed to fetch my requests:', e);
      setError(e instanceof Error ? e.message : 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergeAndSort]);

  useEffect(() => {
    setStaticSegments([{ label: t('myRequests.title'), path: '/my-requests' }]);
    return () => setStaticSegments([]);
    // Intentionally omit t to avoid re-running when i18n reference changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setStaticSegments]);

  const handleCancel = async (requestId: string) => {
    try {
      setCancellingId(requestId);
      await api.delete(`/api/access-grants/requests/${requestId}`);
      toast({ title: t('myRequests.cancelSuccess'), variant: 'default' });
      await loadRequests();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to cancel request',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div>
          <div className="h-8 w-48 rounded-md bg-muted animate-pulse mb-2" />
          <div className="h-4 w-96 rounded-md bg-muted animate-pulse" />
        </div>
        <ListViewSkeleton columns={5} rows={6} toolbarButtons={0} showToolbar={false} showPagination={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={loadRequests}>
          Retry
        </Button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('myRequests.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('myRequests.description')}</p>
        </div>
        <div className="border rounded-lg flex flex-col items-center justify-center py-12">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">{t('myRequests.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('myRequests.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('myRequests.description')}</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('myRequests.type')}</TableHead>
              <TableHead>{t('myRequests.entityType')}</TableHead>
              <TableHead>{t('myRequests.name')}</TableHead>
              <TableHead>{t('myRequests.status')}</TableHead>
              <TableHead>{t('myRequests.requestedAt')}</TableHead>
              <TableHead>{t('myRequests.handledAt')}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const variant = STATUS_VARIANTS[row.status] ?? 'outline';
              const nameDetail = row.source === 'access' ? ` (${row.accessReq.permission_level}, ${row.accessReq.requested_duration_days}d)` : '';
              const entityId = row.source === 'access' ? row.accessReq.entity_id : row.session.entity_id;
              const entityType = row.source === 'access' ? row.accessReq.entity_type : row.session.entity_type;
              const detailPath = getEntityDetailPath(entityType, entityId);
              return (
                <TableRow key={`${row.source}-${row.id}`}>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{t(row.typeLabelKey)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(row.entityTypeKey)}
                  </TableCell>
                  <TableCell>
                    {detailPath ? (
                      <Link to={detailPath} className="font-medium text-primary hover:underline">
                        {row.entityName}
                      </Link>
                    ) : (
                      <span className="font-medium">{row.entityName}</span>
                    )}
                    {row.source === 'access' && nameDetail && (
                      <span className="text-muted-foreground text-sm ml-1">{nameDetail}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant}>{t(row.statusI18nKey)}</Badge>
                  </TableCell>
                  <TableCell>
                    <RelativeDate date={row.created_at} />
                  </TableCell>
                  <TableCell>
                    {row.handled_at ? (
                      <RelativeDate date={row.handled_at} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.canCancel && row.source === 'access' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleCancel(row.id)}
                        disabled={cancellingId === row.id}
                        title={t('myRequests.cancel')}
                      >
                        {cancellingId === row.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

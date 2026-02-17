import { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle, AlertCircle, Box, ChevronDown, Loader2 } from 'lucide-react';
import { ListViewSkeleton } from '@/components/common/list-view-skeleton';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { AssetRead } from '@/types/asset';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { RelativeDate } from '@/components/common/relative-date';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePermissions } from '@/stores/permissions-store';
import { FeatureAccessLevel } from '@/types/settings';
import useBreadcrumbStore from '@/stores/breadcrumb-store';
import { useTranslation } from 'react-i18next';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  deprecated: 'secondary',
  archived: 'destructive',
};

export default function AssetsView() {
  const [assets, setAssets] = useState<AssetRead[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [componentError, setComponentError] = useState<string | null>(null);

  const { t } = useTranslation(['assets', 'common']);
  const { get: apiGet, delete: apiDelete, loading: apiIsLoading } = useApi();
  const { toast } = useToast();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const setStaticSegments = useBreadcrumbStore((state) => state.setStaticSegments);
  const setDynamicTitle = useBreadcrumbStore((state) => state.setDynamicTitle);

  const featureId = 'assets';
  const canRead = !permissionsLoading && hasPermission(featureId, FeatureAccessLevel.READ_ONLY);
  const canWrite = !permissionsLoading && hasPermission(featureId, FeatureAccessLevel.READ_WRITE);
  const canAdmin = !permissionsLoading && hasPermission(featureId, FeatureAccessLevel.ADMIN);

  const fetchAssets = useCallback(async () => {
    if (!canRead && !permissionsLoading) {
      setComponentError(t('permissions.deniedView'));
      return;
    }
    setComponentError(null);
    try {
      const response = await apiGet<AssetRead[]>('/api/assets');
      if (response.error) throw new Error(response.error);
      setAssets(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setComponentError(err.message || 'Failed to load assets');
      setAssets([]);
      toast({ variant: 'destructive', title: t('messages.errorFetching'), description: err.message });
    }
  }, [canRead, permissionsLoading, apiGet, toast, t]);

  useEffect(() => {
    fetchAssets();
    setStaticSegments([]);
    setDynamicTitle(t('title'));
    return () => { setStaticSegments([]); setDynamicTitle(null); };
  }, [fetchAssets, setStaticSegments, setDynamicTitle, t]);

  const openDeleteDialog = (id: string) => {
    if (!canAdmin) {
      toast({ variant: 'destructive', title: t('permissions.permissionDenied'), description: t('permissions.deniedDelete') });
      return;
    }
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId || !canAdmin) return;
    try {
      const response = await apiDelete(`/api/assets/${deletingId}`);
      if (response.error) throw new Error(response.error);
      toast({ title: t('messages.deleted'), description: t('messages.deletedSuccess') });
      fetchAssets();
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('messages.errorDeleting'), description: err.message });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const columns = useMemo<ColumnDef<AssetRead>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('table.name')} <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          {row.original.asset_type_name && (
            <div className="text-xs text-muted-foreground">{row.original.asset_type_name}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'platform',
      header: t('table.platform'),
      cell: ({ row }) => row.original.platform
        ? <Badge variant="outline">{row.original.platform}</Badge>
        : '-',
    },
    {
      accessorKey: 'location',
      header: t('table.location'),
      cell: ({ row }) => (
        <div className="truncate max-w-xs text-sm text-muted-foreground">
          {row.original.location || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('table.status'),
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? 'outline'}>
          {t(`statuses.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      id: 'tags',
      header: t('table.tags'),
      cell: ({ row }) => {
        const tags = row.original.tags;
        if (!tags || tags.length === 0) return '-';
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {tags.length > 3 && <Badge variant="outline" className="text-xs">+{tags.length - 3}</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('table.lastUpdated')} <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.updated_at
        ? <RelativeDate date={row.original.updated_at} />
        : t('common:states.notAvailable'),
    },
    {
      id: 'actions',
      header: t('table.actions'),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
            <DropdownMenuItem disabled={!canWrite}>{t('editAsset')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => openDeleteDialog(row.original.id)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:text-red-400 dark:focus:bg-red-950"
              disabled={!canAdmin}
            >
              {t('deleteAsset')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [canWrite, canAdmin, t]);

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Box className="w-8 h-8" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {(apiIsLoading || permissionsLoading) ? (
        <ListViewSkeleton columns={5} rows={5} toolbarButtons={1} />
      ) : !canRead ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('permissions.permissionDenied')}</AlertTitle>
          <AlertDescription>{t('permissions.deniedView')}</AlertDescription>
        </Alert>
      ) : componentError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('messages.errorLoadingData')}</AlertTitle>
          <AlertDescription>{componentError}</AlertDescription>
        </Alert>
      ) : (
        <DataTable
          columns={columns}
          data={assets}
          searchColumn="name"
          storageKey="assets-sort"
          toolbarActions={
            <Button onClick={() => {}} disabled={!canWrite || apiIsLoading} className="h-9">
              <PlusCircle className="mr-2 h-4 w-4" /> {t('addNew')}
            </Button>
          }
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700" disabled={apiIsLoading}>
              {apiIsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {t('deleteDialog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

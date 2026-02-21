import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Box, Loader2, AlertCircle, Pencil, Trash2,
  MapPin, Globe, Calendar, User, Tag, FileJson,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetRead } from '@/types/asset';
import { EntityTypeDefinition } from '@/types/ontology-schema';
import { AssetFormDialog } from '@/components/common/asset-form-dialog';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { RelativeDate } from '@/components/common/relative-date';
import { EntityRelationshipPanel } from '@/components/common/entity-relationship-panel';
import { usePermissions } from '@/stores/permissions-store';
import { FeatureAccessLevel } from '@/types/settings';
import useBreadcrumbStore from '@/stores/breadcrumb-store';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  active: 'default',
  deprecated: 'secondary',
  archived: 'destructive',
};

function PropertyValue({ value }: { value: any }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }
  if (typeof value === 'boolean') {
    return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>;
  }
  if (typeof value === 'object') {
    return (
      <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40 font-mono">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return <span className="text-sm">{String(value)}</span>;
}

function PropertiesCard({ properties }: { properties?: Record<string, any> | null }) {
  if (!properties || Object.keys(properties).length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileJson className="h-4 w-4" />
          Properties
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {Object.entries(properties).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-2 items-start">
              <Label className="text-sm font-medium text-muted-foreground col-span-1 pt-1">
                {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Label>
              <div className="col-span-2">
                <PropertyValue value={value} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssetDetailView() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<AssetRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [ontologyIri, setOntologyIri] = useState<string | null>(null);

  const { get: apiGet, delete: apiDelete, loading: apiIsLoading } = useApi();
  const { toast } = useToast();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const setStaticSegments = useBreadcrumbStore((state) => state.setStaticSegments);
  const setDynamicTitle = useBreadcrumbStore((state) => state.setDynamicTitle);

  const featureId = 'assets';
  const canWrite = !permissionsLoading && hasPermission(featureId, FeatureAccessLevel.READ_WRITE);
  const canAdmin = !permissionsLoading && hasPermission(featureId, FeatureAccessLevel.ADMIN);

  const fetchAsset = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<AssetRead>(`/api/assets/${assetId}`);
      if (response.error) throw new Error(response.error);
      setAsset(response.data ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to load asset');
    } finally {
      setLoading(false);
    }
  }, [assetId, apiGet]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  useEffect(() => {
    if (asset) {
      setStaticSegments([
        { label: 'Asset Explorer', href: '/governance/assets' },
      ]);
      setDynamicTitle(asset.name);
      // Resolve ontology IRI for the asset type
      (async () => {
        try {
          const resp = await apiGet<EntityTypeDefinition[]>('/api/ontology/entity-types?tier=asset');
          if (!resp.error && Array.isArray(resp.data)) {
            const match = resp.data.find(
              (t) => t.label === asset.asset_type_name || t.local_name === asset.asset_type_name
            );
            setOntologyIri(match?.iri ?? null);
          }
        } catch { /* non-critical */ }
      })();
    }
    return () => { setStaticSegments([]); setDynamicTitle(null); };
  }, [asset, setStaticSegments, setDynamicTitle]);

  const handleDelete = async () => {
    if (!assetId) return;
    try {
      const response = await apiDelete(`/api/assets/${assetId}`);
      if (response.error) throw new Error(response.error);
      toast({ title: 'Asset deleted' });
      navigate(-1);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="py-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Asset not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const entityType = asset.asset_type_name || 'Asset';

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{asset.name}</h1>
              <Badge variant={STATUS_VARIANT[asset.status] ?? 'outline'}>
                {asset.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">{entityType}</Badge>
              {asset.platform && (
                <>
                  <span className="text-muted-foreground">&middot;</span>
                  <span>{asset.platform}</span>
                </>
              )}
            </div>
            {asset.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{asset.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!canWrite} onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            disabled={!canAdmin}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Tabs: Overview, Relationships */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Core metadata card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {asset.location && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location
                    </Label>
                    <p className="text-sm font-mono mt-1 truncate">{asset.location}</p>
                  </div>
                )}
                {asset.platform && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Platform
                    </Label>
                    <p className="text-sm mt-1">{asset.platform}</p>
                  </div>
                )}
                {asset.domain_id && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Domain</Label>
                    <p className="text-sm mt-1">{asset.domain_id}</p>
                  </div>
                )}
                {asset.created_by && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Created By
                    </Label>
                    <p className="text-sm mt-1">{asset.created_by}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Created
                  </Label>
                  <div className="text-sm mt-1">
                    <RelativeDate date={asset.created_at} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Updated
                  </Label>
                  <div className="text-sm mt-1">
                    <RelativeDate date={asset.updated_at} />
                  </div>
                </div>
              </div>

              {/* Tags */}
              {asset.tags && asset.tags.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <Tag className="h-3 w-3" /> Tags
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Properties */}
          <PropertiesCard properties={asset.properties} />

          {/* Quick relationship summary on overview */}
          <EntityRelationshipPanel
            entityType={entityType}
            entityId={asset.id}
            title="Relationships"
            canEdit={canWrite}
          />
        </TabsContent>

        <TabsContent value="relationships" className="mt-4">
          <EntityRelationshipPanel
            entityType={entityType}
            entityId={asset.id}
            title="All Entity Relationships"
            canEdit={canWrite}
          />
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      {asset && (
        <AssetFormDialog
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={() => fetchAsset()}
          assetTypeId={asset.asset_type_id}
          assetTypeName={asset.asset_type_name || 'Asset'}
          assetTypeIri={ontologyIri}
          asset={asset}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{asset.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={apiIsLoading}
            >
              {apiIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Reusable ownership panel for embedding in detail pages.
 * Shows current and (optionally) previous owners for any object type.
 *
 * Usage:
 *   <OwnershipPanel objectType="data_product" objectId={product.id} />
 */
import { useState, useEffect, useCallback } from 'react';
import { Users2, History, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RelativeDate } from '@/components/common/relative-date';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { BusinessOwnerRead, OwnerObjectType } from '@/types/business-owner';

interface OwnershipPanelProps {
  objectType: OwnerObjectType;
  objectId: string;
  /** If true the "Assign Owner" button is shown (requires write permission upstream). */
  canAssign?: boolean;
  /** Callback when user clicks "Assign Owner" – parent opens a dialog. */
  onAssign?: () => void;
  /** Optional CSS class name */
  className?: string;
}

export function OwnershipPanel({ objectType, objectId, canAssign = false, onAssign, className }: OwnershipPanelProps) {
  const [currentOwners, setCurrentOwners] = useState<BusinessOwnerRead[]>([]);
  const [previousOwners, setPreviousOwners] = useState<BusinessOwnerRead[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { t } = useTranslation(['business-owners', 'common']);
  const { get: apiGet } = useApi();
  const { toast } = useToast();

  const fetchOwners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiGet<BusinessOwnerRead[]>(
        `/api/business-owners?object_type=${objectType}&object_id=${objectId}`
      );
      if (response.error) throw new Error(response.error);
      const all = Array.isArray(response.data) ? response.data : [];
      setCurrentOwners(all.filter((o) => o.is_active));
      setPreviousOwners(all.filter((o) => !o.is_active));
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('messages.errorFetching'), description: err.message });
      setCurrentOwners([]);
      setPreviousOwners([]);
    } finally {
      setIsLoading(false);
    }
  }, [objectType, objectId, apiGet, toast, t]);

  useEffect(() => {
    if (objectId) fetchOwners();
  }, [objectId, fetchOwners]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            {t('panel.title')}
          </CardTitle>
          <div className="flex items-center gap-1">
            {previousOwners.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="h-4 w-4 mr-1" />
                {t('panel.history')}
              </Button>
            )}
            {canAssign && onAssign && (
              <Button variant="outline" size="sm" onClick={onAssign}>
                <UserPlus className="h-4 w-4 mr-1" />
                {t('panel.assignOwner')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : currentOwners.length === 0 && previousOwners.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t('panel.noOwners')}</p>
        ) : (
          <div className="space-y-3">
            {/* Current owners */}
            {currentOwners.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('panel.currentOwners')}
                </p>
                {currentOwners.map((owner) => (
                  <div key={owner.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{owner.user_name || owner.user_email}</span>
                      {owner.role_name && (
                        <Badge variant="outline" className="text-xs">{owner.role_name}</Badge>
                      )}
                    </div>
                    <RelativeDate date={owner.assigned_at} className="text-xs text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}

            {/* Previous owners (collapsible) */}
            {showHistory && previousOwners.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('panel.previousOwners')}
                  </p>
                  {previousOwners.map((owner) => (
                    <div key={owner.id} className="flex items-center justify-between text-sm opacity-60">
                      <div className="flex items-center gap-2">
                        <span>{owner.user_name || owner.user_email}</span>
                        {owner.role_name && (
                          <Badge variant="outline" className="text-xs">{owner.role_name}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {owner.removal_reason && (
                          <span className="text-xs italic text-muted-foreground">{owner.removal_reason}</span>
                        )}
                        {owner.removed_at && (
                          <RelativeDate date={owner.removed_at} className="text-xs text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

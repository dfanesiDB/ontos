import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, Plus, Check, Search, ChevronRight, ChevronLeft,
  Shapes, Tag, Database, Package, Server, Shield, Send, BookOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LinkCandidate {
  id: string;
  name: string;
  entity_type: string;
  description?: string | null;
  status?: string | null;
  score: number;
}

interface PendingRelationship {
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship_type: string;
  target_name: string;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  logical_model: Shapes,
  physical_mapping: Database,
  systems_products: Package,
  policies: Shield,
  delivery: Send,
  review: Check,
};

const STEPS = [
  { id: 'logical_model', label: 'Logical Model', description: 'Link to logical entities and attributes' },
  { id: 'physical_mapping', label: 'Physical Mapping', description: 'Map logical attributes to datasets and columns' },
  { id: 'systems_products', label: 'Systems & Products', description: 'Identify source systems and data products' },
  { id: 'delivery', label: 'Delivery Channels', description: 'Define how data is delivered to consumers' },
  { id: 'policies', label: 'Policies', description: 'Attach governance policies' },
  { id: 'review', label: 'Review & Save', description: 'Review all relationships and save' },
];

interface LineageEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  entityName: string;
  onSuccess?: () => void;
}

export function LineageEditor({
  isOpen,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  onSuccess,
}: LineageEditorProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [pendingRelationships, setPendingRelationships] = useState<PendingRelationship[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setPendingRelationships([]);
    }
  }, [isOpen]);

  const addRelationship = useCallback((rel: PendingRelationship) => {
    setPendingRelationships(prev => {
      const exists = prev.some(
        p => p.source_type === rel.source_type && p.source_id === rel.source_id &&
             p.target_type === rel.target_type && p.target_id === rel.target_id &&
             p.relationship_type === rel.relationship_type
      );
      if (exists) return prev;
      return [...prev, rel];
    });
  }, []);

  const removeRelationship = useCallback((index: number) => {
    setPendingRelationships(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    if (pendingRelationships.length === 0) {
      onOpenChange(false);
      return;
    }
    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;
    for (const rel of pendingRelationships) {
      try {
        const res = await fetch('/api/entity-relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_type: rel.source_type,
            source_id: rel.source_id,
            target_type: rel.target_type,
            target_id: rel.target_id,
            relationship_type: rel.relationship_type,
          }),
        });
        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }
    setIsSaving(false);
    toast({
      title: errorCount === 0 ? 'Lineage saved' : 'Partially saved',
      description: `${successCount} relationship(s) created${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });
    onOpenChange(false);
    onSuccess?.();
  };

  const step = STEPS[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Manage Business Lineage
            <Badge variant="outline" className="text-xs font-normal">{entityName}</Badge>
          </DialogTitle>
          <DialogDescription>
            Build or update the business lineage for this entity step by step.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = STEP_ICONS[s.id] || Shapes;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isDone ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-3 w-3" />
                {s.label}
              </button>
            );
          })}
        </div>

        <Separator />

        {/* Step content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="py-3">
            {currentStep < 5 ? (
              <CandidateSearchStep
                entityType={entityType}
                entityId={entityId}
                stepConfig={getStepConfig(step.id, entityType)}
                onAddRelationship={addRelationship}
                pendingRelationships={pendingRelationships}
              />
            ) : (
              <ReviewStep
                pendingRelationships={pendingRelationships}
                onRemove={removeRelationship}
              />
            )}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(s => s - 1)}
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back
            </Button>
            {currentStep < STEPS.length - 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(s => s + 1)}
              >
                Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">
              {pendingRelationships.length} relationship(s) queued
            </span>
            {currentStep === STEPS.length - 1 && (
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Save All
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StepConfig {
  targetType: string;
  relationshipType: string;
  direction: 'outgoing' | 'incoming';
  label: string;
}

function getStepConfig(stepId: string, entityType: string): StepConfig {
  const configs: Record<string, StepConfig> = {
    logical_model: {
      targetType: 'LogicalEntity',
      relationshipType: 'relatesTo',
      direction: 'outgoing',
      label: 'Logical Entities',
    },
    physical_mapping: {
      targetType: 'Dataset',
      relationshipType: 'implementedBy',
      direction: 'outgoing',
      label: 'Datasets & Columns',
    },
    systems_products: {
      targetType: 'DataProduct',
      relationshipType: 'dependsOn',
      direction: 'outgoing',
      label: 'Data Products',
    },
    delivery: {
      targetType: 'DeliveryChannel',
      relationshipType: 'exposes',
      direction: 'outgoing',
      label: 'Delivery Channels',
    },
    policies: {
      targetType: 'Policy',
      relationshipType: 'appliesTo',
      direction: 'incoming',
      label: 'Policies',
    },
  };
  return configs[stepId] || configs.logical_model;
}

interface CandidateSearchStepProps {
  entityType: string;
  entityId: string;
  stepConfig: StepConfig;
  onAddRelationship: (rel: PendingRelationship) => void;
  pendingRelationships: PendingRelationship[];
}

function CandidateSearchStep({
  entityType,
  entityId,
  stepConfig,
  onAddRelationship,
  pendingRelationships,
}: CandidateSearchStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<LinkCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const search = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          target_type: stepConfig.targetType,
          limit: '20',
        });
        if (searchQuery) params.set('query', searchQuery);

        const res = await fetch(`/api/suggestions/link-candidates?${params}`);
        if (res.ok) {
          const data = await res.json();
          setCandidates(data.candidates || []);
        }
      } catch {
        setCandidates([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, stepConfig.targetType]);

  const isAlreadyAdded = (candidateId: string) => {
    return pendingRelationships.some(r => {
      if (stepConfig.direction === 'outgoing') {
        return r.target_id === candidateId && r.relationship_type === stepConfig.relationshipType;
      }
      return r.source_id === candidateId && r.relationship_type === stepConfig.relationshipType;
    });
  };

  const handleAdd = (candidate: LinkCandidate) => {
    const rel: PendingRelationship = stepConfig.direction === 'outgoing'
      ? {
          source_type: entityType,
          source_id: entityId,
          target_type: stepConfig.targetType,
          target_id: candidate.id,
          relationship_type: stepConfig.relationshipType,
          target_name: candidate.name,
        }
      : {
          source_type: stepConfig.targetType,
          source_id: candidate.id,
          target_type: entityType,
          target_id: entityId,
          relationship_type: stepConfig.relationshipType,
          target_name: candidate.name,
        };
    onAddRelationship(rel);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm">Search {stepConfig.label}</Label>
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search for ${stepConfig.label.toLowerCase()}...`}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        {isSearching ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching...
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-sm text-muted-foreground p-3">
            No candidates found. Try a different search term.
          </div>
        ) : (
          candidates.map((c) => {
            const added = isAlreadyAdded(c.id);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-md border hover:bg-accent/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{c.name}</div>
                  {c.description && (
                    <div className="text-xs text-muted-foreground truncate">{c.description}</div>
                  )}
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge variant="outline" className="text-[9px] h-3.5">{c.entity_type}</Badge>
                    {c.status && (
                      <Badge variant="secondary" className="text-[9px] h-3.5">{c.status}</Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={added ? 'secondary' : 'outline'}
                  className="ml-2 h-7 text-xs"
                  disabled={added}
                  onClick={() => handleAdd(c)}
                >
                  {added ? (
                    <><Check className="mr-1 h-3 w-3" /> Added</>
                  ) : (
                    <><Plus className="mr-1 h-3 w-3" /> Add</>
                  )}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface ReviewStepProps {
  pendingRelationships: PendingRelationship[];
  onRemove: (index: number) => void;
}

function ReviewStep({ pendingRelationships, onRemove }: ReviewStepProps) {
  if (pendingRelationships.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No relationships queued. Go back to add some.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">
        {pendingRelationships.length} relationship(s) will be created when you save.
      </p>
      {pendingRelationships.map((rel, i) => (
        <Card key={i}>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{rel.source_type}</span>
              <span className="mx-2 text-muted-foreground">
                —[{rel.relationship_type}]→
              </span>
              <span className="font-medium">{rel.target_name}</span>
              <Badge variant="outline" className="ml-2 text-[9px]">{rel.target_type}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => onRemove(i)}
            >
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

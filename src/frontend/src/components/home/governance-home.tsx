import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BoxSelect, Shield, Shapes, ArrowRight, TrendingUp, Globe, GitBranch, Tag } from 'lucide-react';

export default function GovernanceHome() {
  const [domains, setDomains] = useState<any[]>([]);
  const [policyCount, setPolicyCount] = useState<number>(0);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<{ score?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    const fetchPolicyCount = async () => {
      try {
        const typesRes = await fetch('/api/asset-types/summary');
        if (!typesRes.ok) return 0;
        const types = await typesRes.json();
        const policyType = (Array.isArray(types) ? types : []).find((t: any) => t.name === 'Policy');
        if (!policyType) return 0;
        const assetsRes = await fetch(`/api/assets?asset_type_id=${policyType.id}&limit=1000`);
        if (!assetsRes.ok) return 0;
        const assets = await assetsRes.json();
        return Array.isArray(assets) ? assets.length : 0;
      } catch { return 0; }
    };

    Promise.allSettled([
      fetch('/api/data-domains').then(r => r.ok ? r.json() : []),
      fetchPolicyCount(),
      fetch('/api/ontology/entity-types?tier=asset').then(r => r.ok ? r.json() : []),
      fetch('/api/compliance/trend').then(r => r.ok ? r.json() : []),
    ]).then(([domainsData, policiesData, typesData, trendData]) => {
      if (domainsData.status === 'fulfilled') setDomains(Array.isArray(domainsData.value) ? domainsData.value : []);
      if (policiesData.status === 'fulfilled') setPolicyCount(typeof policiesData.value === 'number' ? policiesData.value : 0);
      if (typesData.status === 'fulfilled') setAssetTypes(Array.isArray(typesData.value) ? typesData.value : []);
      if (trendData.status === 'fulfilled') {
        const trend = Array.isArray(trendData.value) ? trendData.value : [];
        const latest = trend.length > 0 ? trend[trend.length - 1] : null;
        setCompliance(latest ? { score: latest.score } : null);
      }
    })
    .catch(e => console.warn('GovernanceHome fetch error:', e))
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2.5">
                <BoxSelect className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Domains</p>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : domains.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2.5">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Policies</p>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : policyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-500/10 p-2.5">
                <Shapes className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset Types</p>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : assetTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-12" /> : compliance?.score != null ? `${Math.round(compliance.score)}%` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Data Domains</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/governance/domains">View all <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : domains.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No domains defined yet</p>
            ) : (
              <div className="space-y-3">
                {domains.slice(0, 8).map((d: any) => (
                  <Link key={d.id} to={`/governance/domains/${d.id}`} className="flex items-center justify-between hover:bg-muted/50 rounded-md px-3 py-2 -mx-3 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{d.name ?? d.id}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.description ?? ''}</p>
                    </div>
                    {d.status && <Badge variant="outline" className="capitalize ml-2">{d.status}</Badge>}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/governance/domains"><BoxSelect className="h-4 w-4 mr-2" />Manage Domains</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/governance/assets"><Shield className="h-4 w-4 mr-2" />Manage Policies</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/governance/assets"><Shapes className="h-4 w-4 mr-2" />Asset Explorer</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/governance/workflows"><GitBranch className="h-4 w-4 mr-2" />Workflows</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/governance/tags"><Tag className="h-4 w-4 mr-2" />Manage Tags</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/governance/estates"><Globe className="h-4 w-4 mr-2" />Estate Manager</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

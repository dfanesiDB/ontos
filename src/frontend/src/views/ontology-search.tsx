import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brain, Globe2 } from 'lucide-react';
import useBreadcrumbStore from '@/stores/breadcrumb-store';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KGSearch from '@/components/search/kg-search';
import ConceptsSearch from '@/components/search/concepts-search';
import PropertiesSearch from '@/components/search/properties-search';

type OntologyMode = 'concepts' | 'properties' | 'kg';

function getModeFromPath(pathname: string): OntologyMode {
  const last = pathname.split('/').filter(Boolean).pop();
  if (last === 'kg') return 'kg';
  return 'concepts';
}

export default function OntologySearchView() {
  const { t } = useTranslation(['search', 'semantic-models', 'common']);
  const location = useLocation();
  const setStaticSegments = useBreadcrumbStore((state) => state.setStaticSegments);
  const setDynamicTitle = useBreadcrumbStore((state) => state.setDynamicTitle);

  const pathMode = getModeFromPath(location.pathname);
  const isKgMode = pathMode === 'kg';

  const [searchMode, setSearchMode] = useState<'concepts' | 'properties'>('concepts');

  const params = new URLSearchParams(location.search);

  const pageTitle = isKgMode
    ? t('search:tabs.searchGraph', { defaultValue: 'Search Graph' })
    : t('search:tabs.searchConcepts', { defaultValue: 'Search Concepts' });

  const pageSubtitle = isKgMode
    ? t('search:subtitles.searchGraph', { defaultValue: 'Query and explore the knowledge graph using SPARQL' })
    : t('search:subtitles.searchConcepts', { defaultValue: 'Search and browse ontology concepts and properties' });

  useEffect(() => {
    setStaticSegments([]);
    setDynamicTitle(pageTitle);
    return () => {
      setStaticSegments([]);
      setDynamicTitle(null);
    };
  }, [setStaticSegments, setDynamicTitle, pageTitle]);

  if (isKgMode) {
    const kgPrefix = params.get('prefix') || '';
    const kgPath = params.get('path')?.split('|').filter(Boolean) || [];
    const kgSparql = params.get('sparql') || 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10';
    const kgDirection = (params.get('direction') as 'all' | 'incoming' | 'outgoing') || 'all';
    const kgConceptsOnly = params.get('concepts_only') === 'true';

    return (
      <div className="py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe2 className="w-8 h-8" />
            {pageTitle}
          </h1>
          <p className="text-muted-foreground mt-1">{pageSubtitle}</p>
        </div>

        <KGSearch
          initialPrefix={kgPrefix}
          initialPath={kgPath}
          initialSparql={kgSparql}
          initialDirectionFilter={kgDirection}
          initialShowConceptsOnly={kgConceptsOnly}
        />
      </div>
    );
  }

  const query = params.get('query') || '';
  const iri = params.get('iri');

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="w-8 h-8" />
          {pageTitle}
        </h1>
        <p className="text-muted-foreground mt-1">{pageSubtitle}</p>
      </div>

      <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as 'concepts' | 'properties')}>
        <TabsList>
          <TabsTrigger value="concepts">{t('search:tabs.concepts', { defaultValue: 'Concepts' })}</TabsTrigger>
          <TabsTrigger value="properties">{t('search:tabs.properties', { defaultValue: 'Properties' })}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {searchMode === 'concepts' ? (
          <ConceptsSearch
            initialQuery={query}
            initialSelectedConcept={iri ? {
              value: iri,
              label: iri.split('/').pop() || iri.split('#').pop() || iri,
              type: 'class' as const,
            } : null}
          />
        ) : (
          <PropertiesSearch
            initialQuery={query}
            initialSelectedProperty={iri ? {
              value: iri,
              label: iri.split('/').pop() || iri.split('#').pop() || iri,
              type: 'property' as const,
            } : null}
          />
        )}
      </div>
    </div>
  );
}

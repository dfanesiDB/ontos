/**
 * Persona-based navigation config.
 * Each persona has a list of nav items (label, path, optional featureId for permission checks).
 */

import type { PersonaId } from '@/types/settings';

export interface PersonaNavItem {
  id: string;
  labelKey: string; // i18n key, e.g. 'personaNav.data_consumer.home'
  path: string;
  featureId?: string; // If set, menu item is shown only when user has READ_ONLY+ on this feature
}

/** Nav items per persona (persona ID -> list of nav items). */
export const PERSONA_NAV: Record<PersonaId, PersonaNavItem[]> = {
  data_consumer: [
    { id: 'marketplace', labelKey: 'personaNav.marketplace', path: '/', featureId: 'data-products' },
    { id: 'my-products', labelKey: 'personaNav.myProducts', path: '/my-products', featureId: 'data-products' },
    { id: 'business-lineage', labelKey: 'personaNav.businessLineage', path: '/data-catalog', featureId: 'data-catalog' },
    { id: 'requests', labelKey: 'personaNav.requests', path: '/my-requests', featureId: 'access-grants' },
  ],
  data_producer: [
    { id: 'home', labelKey: 'personaNav.home', path: '/' },
    { id: 'data-products', labelKey: 'personaNav.dataProducts', path: '/data-products', featureId: 'data-products' },
    { id: 'datasets', labelKey: 'personaNav.datasets', path: '/datasets', featureId: 'datasets' },
    { id: 'contracts', labelKey: 'personaNav.contracts', path: '/data-contracts', featureId: 'data-contracts' },
    { id: 'requests', labelKey: 'personaNav.requests', path: '/data-asset-reviews', featureId: 'data-asset-reviews' },
  ],
  data_product_owner: [
    { id: 'home', labelKey: 'personaNav.home', path: '/' },
    { id: 'my-products', labelKey: 'personaNav.myProducts', path: '/data-products', featureId: 'data-products' },
    { id: 'contracts', labelKey: 'personaNav.contracts', path: '/data-contracts', featureId: 'data-contracts' },
    { id: 'consumers', labelKey: 'personaNav.consumers', path: '/data-products', featureId: 'data-products' },
    { id: 'product-health', labelKey: 'personaNav.productHealth', path: '/compliance', featureId: 'compliance' },
  ],
  data_steward: [
    { id: 'home', labelKey: 'personaNav.home', path: '/' },
    { id: 'catalog-commander', labelKey: 'personaNav.catalogCommander', path: '/catalog-commander', featureId: 'catalog-commander' },
    { id: 'compliance-checks', labelKey: 'personaNav.complianceChecks', path: '/compliance', featureId: 'compliance' },
    { id: 'asset-review', labelKey: 'personaNav.assetReview', path: '/data-asset-reviews', featureId: 'data-asset-reviews' },
  ],
  data_governance_officer: [
    { id: 'home', labelKey: 'personaNav.home', path: '/' },
    { id: 'domains', labelKey: 'personaNav.domains', path: '/data-domains', featureId: 'data-domains' },
    { id: 'teams', labelKey: 'personaNav.teams', path: '/teams', featureId: 'teams' },
    { id: 'projects', labelKey: 'personaNav.projects', path: '/projects', featureId: 'projects' },
    { id: 'policies', labelKey: 'personaNav.policies', path: '/compliance', featureId: 'compliance' },
    { id: 'tags', labelKey: 'personaNav.tags', path: '/settings', featureId: 'settings' },
    { id: 'workflows', labelKey: 'personaNav.workflows', path: '/workflows', featureId: 'process-workflows' },
  ],
  ontology_engineer: [
    { id: 'home', labelKey: 'personaNav.home', path: '/' },
    { id: 'domains', labelKey: 'personaNav.domains', path: '/data-domains', featureId: 'data-domains' },
    { id: 'collections', labelKey: 'personaNav.collections', path: '/semantic-models', featureId: 'semantic-models' },
    { id: 'glossaries', labelKey: 'personaNav.glossaries', path: '/semantic-models', featureId: 'semantic-models' },
    { id: 'concepts', labelKey: 'personaNav.concepts', path: '/semantic-models', featureId: 'semantic-models' },
    { id: 'properties', labelKey: 'personaNav.properties', path: '/semantic-models', featureId: 'semantic-models' },
    { id: 'ontologies', labelKey: 'personaNav.ontologies', path: '/semantic-models', featureId: 'semantic-models' },
    { id: 'knowledge-graph', labelKey: 'personaNav.knowledgeGraph', path: '/search/kg', featureId: 'llm-search' },
  ],
  business_term_owner: [
    { id: 'home', labelKey: 'personaNav.home', path: '/' },
    { id: 'terms', labelKey: 'personaNav.terms', path: '/semantic-models', featureId: 'semantic-models' },
    { id: 'requests', labelKey: 'personaNav.requests', path: '/data-asset-reviews', featureId: 'data-asset-reviews' },
  ],
  administrator: [
    { id: 'home', labelKey: 'personaNav.home', path: '/' },
    { id: 'git', labelKey: 'personaNav.git', path: '/settings', featureId: 'settings' },
    { id: 'jobs', labelKey: 'personaNav.jobs', path: '/settings', featureId: 'settings' },
    { id: 'app-roles', labelKey: 'personaNav.appRoles', path: '/settings', featureId: 'settings' },
    { id: 'search-settings', labelKey: 'personaNav.searchSettings', path: '/settings', featureId: 'settings' },
    { id: 'mcp-settings', labelKey: 'personaNav.mcpSettings', path: '/settings', featureId: 'settings' },
    { id: 'ui-customization', labelKey: 'personaNav.uiCustomization', path: '/settings', featureId: 'settings' },
    { id: 'audit', labelKey: 'personaNav.audit', path: '/audit', featureId: 'audit' },
    { id: 'connectors', labelKey: 'personaNav.connectors', path: '/settings', featureId: 'settings' },
  ],
};

/** Persona display names for switcher and role edit (i18n keys). */
export const PERSONA_LABEL_KEYS: Record<PersonaId, string> = {
  data_consumer: 'personas.data_consumer',
  data_producer: 'personas.data_producer',
  data_product_owner: 'personas.data_product_owner',
  data_steward: 'personas.data_steward',
  data_governance_officer: 'personas.data_governance_officer',
  ontology_engineer: 'personas.ontology_engineer',
  business_term_owner: 'personas.business_term_owner',
  administrator: 'personas.administrator',
};

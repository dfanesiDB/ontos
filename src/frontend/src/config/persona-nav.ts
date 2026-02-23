/**
 * Persona-based navigation config.
 * Each persona has a list of nav items with optional group headers for sectioned sidebar rendering.
 */

import type { PersonaId } from '@/types/settings';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  ShoppingCart,
  Package,
  BookOpen,
  MessageSquare,
  FileText,
  ClipboardCheck,
  CheckCircle,
  FolderKanban,
  BoxSelect,
  UserCheck,
  Shield,
  GitBranch,
  Tag,
  Layers,
  Shapes,
  Search,
  ScrollText,
  Cpu,
  Palette,
  Briefcase,
  Users,
  Users2,
  Lock,
  RefreshCw,
  Globe,
  Globe2,
  Database,
  Box,
  Settings,
  Truck,
  Info,
  Factory,
  Scale,
  Landmark,
  ShieldCheck,
  Brain,
  Network,
  BookMarked,
  Wrench,
} from 'lucide-react';

export interface PersonaNavItem {
  id: string;
  labelKey: string; // i18n key, e.g. 'personaNav.marketplace'
  path: string;
  icon: LucideIcon;
  featureId?: string; // If set, menu item is shown only when user has READ_ONLY+ on this feature
  group?: string; // Section header label key for grouped nav rendering
}

/** URL prefix per persona. */
export const PERSONA_BASE_PATHS: Record<PersonaId, string> = {
  data_consumer: '/consumer',
  data_producer: '/producer',
  data_steward: '/steward',
  data_governance_officer: '/governance',
  security_officer: '/security',
  administrator: '/admin',
};

/** Nav items per persona with grouped sections. */
export const PERSONA_NAV: Record<PersonaId, PersonaNavItem[]> = {
  data_consumer: [
    // -- DISCOVER --
    { id: 'marketplace', labelKey: 'personaNav.marketplace', path: '/consumer', icon: ShoppingCart, featureId: 'data-products', group: 'discover' },
    { id: 'catalog', labelKey: 'personaNav.dataCatalog', path: '/consumer/catalog', icon: Search, featureId: 'data-catalog', group: 'discover' },
    { id: 'glossary', labelKey: 'personaNav.businessGlossary', path: '/consumer/glossary', icon: BookOpen, featureId: 'semantic-models', group: 'discover' },
    // -- MY DATA --
    { id: 'my-subscriptions', labelKey: 'personaNav.mySubscriptions', path: '/consumer/my-products', icon: Package, featureId: 'data-products', group: 'myData' },
    { id: 'requests', labelKey: 'personaNav.accessRequests', path: '/consumer/requests', icon: MessageSquare, featureId: 'access-grants', group: 'myData' },
  ],
  data_producer: [
    // -- BUILD --
    { id: 'home', labelKey: 'personaNav.home', path: '/producer', icon: Home, group: 'build' },
    { id: 'data-products', labelKey: 'personaNav.dataProducts', path: '/producer/products', icon: Package, featureId: 'data-products', group: 'build' },
    { id: 'contracts', labelKey: 'personaNav.dataContracts', path: '/producer/contracts', icon: FileText, featureId: 'data-contracts', group: 'build' },
    { id: 'data-assets', labelKey: 'personaNav.dataAssets', path: '/producer/assets', icon: Database, featureId: 'assets', group: 'build' },
    // -- MONITOR --
    { id: 'quality', labelKey: 'personaNav.qualityCompliance', path: '/producer/quality', icon: CheckCircle, featureId: 'compliance', group: 'monitor' },
    { id: 'consumers', labelKey: 'personaNav.myConsumers', path: '/producer/consumers', icon: Users, featureId: 'data-products', group: 'monitor' },
    // -- TASKS --
    { id: 'reviews', labelKey: 'personaNav.reviewsApprovals', path: '/producer/reviews', icon: ClipboardCheck, featureId: 'data-asset-reviews', group: 'tasks' },
  ],
  data_steward: [
    // -- CATALOG --
    { id: 'home', labelKey: 'personaNav.home', path: '/steward', icon: Home, group: 'catalog' },
    { id: 'asset-explorer', labelKey: 'personaNav.assetExplorer', path: '/steward/assets', icon: Box, featureId: 'assets', group: 'catalog' },
    { id: 'catalog', labelKey: 'personaNav.dataCatalog', path: '/steward/catalog', icon: BookOpen, featureId: 'data-catalog', group: 'catalog' },
    { id: 'glossary', labelKey: 'personaNav.businessGlossary', path: '/steward/glossary', icon: BookMarked, featureId: 'semantic-models', group: 'catalog' },
    // -- GOVERN --
    { id: 'compliance', labelKey: 'personaNav.compliance', path: '/steward/compliance', icon: CheckCircle, featureId: 'compliance', group: 'govern' },
    { id: 'reviews', labelKey: 'personaNav.reviewsApprovals', path: '/steward/reviews', icon: ClipboardCheck, featureId: 'data-asset-reviews', group: 'govern' },
    { id: 'master-data', labelKey: 'personaNav.masterData', path: '/steward/master-data', icon: Database, featureId: 'master-data', group: 'govern' },
    // -- TOOLS --
    { id: 'commander', labelKey: 'personaNav.catalogCommander', path: '/steward/commander', icon: FolderKanban, featureId: 'catalog-commander', group: 'tools' },
  ],
  data_governance_officer: [
    // -- ORGANIZE --
    { id: 'home', labelKey: 'personaNav.home', path: '/governance', icon: Home, group: 'organize' },
    { id: 'domains', labelKey: 'personaNav.domains', path: '/governance/domains', icon: BoxSelect, featureId: 'data-domains', group: 'organize' },
    { id: 'teams', labelKey: 'personaNav.teams', path: '/governance/teams', icon: UserCheck, featureId: 'teams', group: 'organize' },
    { id: 'ownership', labelKey: 'personaNav.ownership', path: '/governance/ownership', icon: Users2, featureId: 'business-owners', group: 'organize' },
    // -- STANDARDS --
    { id: 'collections', labelKey: 'personaNav.collections', path: '/governance/collections', icon: Layers, featureId: 'semantic-models', group: 'standards' },
    { id: 'glossary', labelKey: 'personaNav.businessGlossary', path: '/governance/glossary', icon: BookMarked, featureId: 'semantic-models', group: 'standards' },
    { id: 'workflows', labelKey: 'personaNav.workflows', path: '/governance/workflows', icon: GitBranch, featureId: 'process-workflows', group: 'standards' },
    // -- OVERSIGHT --
    { id: 'asset-explorer', labelKey: 'personaNav.assetExplorer', path: '/governance/assets', icon: Box, featureId: 'assets', group: 'oversight' },
    { id: 'compliance', labelKey: 'personaNav.compliance', path: '/governance/compliance', icon: CheckCircle, featureId: 'compliance', group: 'oversight' },
    { id: 'audit', labelKey: 'personaNav.audit', path: '/governance/audit', icon: ScrollText, featureId: 'audit', group: 'oversight' },
    { id: 'estates', labelKey: 'personaNav.estateManager', path: '/governance/estates', icon: Globe, featureId: 'estate-manager', group: 'oversight' },
    // -- ADVANCED --
    { id: 'ontology', labelKey: 'personaNav.searchConcepts', path: '/governance/ontology', icon: Brain, featureId: 'semantic-models', group: 'advanced' },
    { id: 'concept-graph', labelKey: 'personaNav.viewGraph', path: '/governance/graph', icon: Network, featureId: 'semantic-models', group: 'advanced' },
    { id: 'knowledge-graph', labelKey: 'personaNav.searchGraph', path: '/governance/kg', icon: Globe2, featureId: 'semantic-models', group: 'advanced' },
    { id: 'rdf-sources', labelKey: 'personaNav.rdfSources', path: '/governance/rdf-sources', icon: Settings, featureId: 'semantic-models', group: 'advanced' },
    { id: 'asset-types', labelKey: 'personaNav.assetTypes', path: '/governance/asset-types', icon: Shapes, featureId: 'assets', group: 'advanced' },
    { id: 'tags', labelKey: 'personaNav.tags', path: '/governance/tags', icon: Tag, featureId: 'settings', group: 'advanced' },
  ],
  security_officer: [
    // -- ACCESS CONTROL --
    { id: 'home', labelKey: 'personaNav.home', path: '/security', icon: Home, group: 'accessControl' },
    { id: 'entitlements', labelKey: 'personaNav.entitlements', path: '/security/entitlements', icon: Shield, featureId: 'entitlements', group: 'accessControl' },
    { id: 'security-features', labelKey: 'personaNav.securityFeatures', path: '/security/features', icon: Lock, featureId: 'security-features', group: 'accessControl' },
    { id: 'sync', labelKey: 'personaNav.entitlementsSync', path: '/security/sync', icon: RefreshCw, featureId: 'entitlements-sync', group: 'accessControl' },
    // -- MONITORING --
    { id: 'audit', labelKey: 'personaNav.audit', path: '/security/audit', icon: ScrollText, featureId: 'audit', group: 'monitoring' },
  ],
  administrator: [
    // -- CONFIGURATION --
    { id: 'home', labelKey: 'personaNav.home', path: '/admin', icon: Home, group: 'configuration' },
    { id: 'general', labelKey: 'personaNav.general', path: '/admin/general', icon: Settings, featureId: 'settings', group: 'configuration' },
    { id: 'ui', labelKey: 'personaNav.uiCustomization', path: '/admin/ui', icon: Palette, featureId: 'settings', group: 'configuration' },
    // -- AUTOMATION --
    { id: 'jobs', labelKey: 'personaNav.jobs', path: '/admin/jobs', icon: Briefcase, featureId: 'settings', group: 'automation' },
    { id: 'delivery', labelKey: 'personaNav.deliveryModes', path: '/admin/delivery', icon: Truck, featureId: 'settings', group: 'automation' },
    { id: 'git', labelKey: 'personaNav.git', path: '/admin/git', icon: GitBranch, featureId: 'settings', group: 'automation' },
    // -- ACCESS --
    { id: 'roles', labelKey: 'personaNav.appRoles', path: '/admin/roles', icon: Shield, featureId: 'settings', group: 'access' },
    { id: 'business-roles', labelKey: 'personaNav.businessRoles', path: '/admin/business-roles', icon: Briefcase, featureId: 'business-roles', group: 'access' },
    // -- SYSTEM --
    { id: 'search-settings', labelKey: 'personaNav.searchSettings', path: '/admin/search', icon: Search, featureId: 'settings', group: 'system' },
    { id: 'mcp', labelKey: 'personaNav.mcpSettings', path: '/admin/mcp', icon: Cpu, featureId: 'settings', group: 'system' },
    { id: 'audit', labelKey: 'personaNav.audit', path: '/admin/audit', icon: ScrollText, featureId: 'audit', group: 'system' },
    { id: 'about', labelKey: 'personaNav.about', path: '/admin/about', icon: Info, group: 'system' },
  ],
};

/** Persona display names for switcher and role edit (i18n keys). */
export const PERSONA_LABEL_KEYS: Record<PersonaId, string> = {
  data_consumer: 'personas.data_consumer',
  data_producer: 'personas.data_producer',
  data_steward: 'personas.data_steward',
  data_governance_officer: 'personas.data_governance_officer',
  security_officer: 'personas.security_officer',
  administrator: 'personas.administrator',
};

/** Visual identity per persona: icon, Tailwind color classes, and description i18n key. */
export interface PersonaMeta {
  icon: LucideIcon;
  /** Subtle background for the icon circle */
  bgClass: string;
  /** Icon/text color */
  textClass: string;
  /** i18n key for a short description shown in the switcher popover */
  descriptionKey: string;
}

export const PERSONA_META: Record<PersonaId, PersonaMeta> = {
  data_consumer: {
    icon: ShoppingCart,
    bgClass: 'bg-blue-500/15 dark:bg-blue-500/20',
    textClass: 'text-blue-600 dark:text-blue-400',
    descriptionKey: 'personaDescriptions.data_consumer',
  },
  data_producer: {
    icon: Factory,
    bgClass: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    descriptionKey: 'personaDescriptions.data_producer',
  },
  data_steward: {
    icon: Scale,
    bgClass: 'bg-amber-500/15 dark:bg-amber-500/20',
    textClass: 'text-amber-600 dark:text-amber-400',
    descriptionKey: 'personaDescriptions.data_steward',
  },
  data_governance_officer: {
    icon: Landmark,
    bgClass: 'bg-purple-500/15 dark:bg-purple-500/20',
    textClass: 'text-purple-600 dark:text-purple-400',
    descriptionKey: 'personaDescriptions.data_governance_officer',
  },
  security_officer: {
    icon: ShieldCheck,
    bgClass: 'bg-red-500/15 dark:bg-red-500/20',
    textClass: 'text-red-600 dark:text-red-400',
    descriptionKey: 'personaDescriptions.security_officer',
  },
  administrator: {
    icon: Wrench,
    bgClass: 'bg-slate-500/15 dark:bg-slate-500/20',
    textClass: 'text-slate-600 dark:text-slate-400',
    descriptionKey: 'personaDescriptions.administrator',
  },
};

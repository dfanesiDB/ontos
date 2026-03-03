import {
    FileTextIcon,
    Network,
    Users,
    Users2,
    CheckCircle,
    Globe,
    Lock,
    Shield,
    RefreshCw,
    FolderKanban,
    Settings,
    Info,
    ClipboardCheck,
    BoxSelect,
    Search,
    UserCheck,
    FolderOpen,
    ScrollText,
    Table2,
    Package,
    GitBranch,
    BookOpen,
    Box,
    Shapes,
    Briefcase,
    Layers,
    FileInput,
    TreePine,
    ShoppingCart,
    ClipboardList,
    Brain,
    Globe2,
    type LucideIcon,
  } from 'lucide-react';
  
  export type FeatureMaturity = 'ga' | 'beta' | 'alpha';
  export type FeatureGroup = 'Data Products' | 'Governance' | 'Operations' | 'Security' | 'System';
  
  export interface FeatureConfig {
    id: string;
    name: string;
    path: string;
    description: string;
    icon: LucideIcon;
    group: FeatureGroup;
    maturity: FeatureMaturity;
    showInLanding?: boolean;
    /** When set, permission checks use this feature ID instead of `id`. */
    permissionId?: string;
  }
  
  export const features: FeatureConfig[] = [
    // Data Products - Core product development lifecycle
    {
      id: 'data-domains',
      name: 'Domains',
      path: '/data-domains',
      description: 'Organize data products and assets into logical domains.',
      icon: BoxSelect,
      group: 'Data Products',
      maturity: 'ga',
      showInLanding: true,
    },
    {
      id: 'teams',
      name: 'Teams',
      path: '/teams',
      description: 'Manage teams and team members with role overrides.',
      icon: UserCheck,
      group: 'Data Products',
      maturity: 'ga',
      showInLanding: false,
    },
    {
      id: 'projects',
      name: 'Projects',
      path: '/projects',
      description: 'Manage projects and assign teams for workspace isolation.',
      icon: FolderOpen,
      group: 'Data Products',
      maturity: 'ga',
      showInLanding: false,
    },
    {
      id: 'data-contracts',
      name: 'Contracts',
      path: '/data-contracts',
      description: 'Define and enforce technical metadata standards.',
      icon: FileTextIcon,
      group: 'Data Products',
      maturity: 'ga',
      showInLanding: true,
    },
    {
      id: 'data-products',
      name: 'Products',
      path: '/data-products',
      description: 'Group and manage related Databricks assets with tags.',
      icon: Package,
      group: 'Data Products',
      maturity: 'ga',
      showInLanding: true,
    },
    {
      id: 'my-products',
      name: 'My Products',
      path: '/my-products',
      description: 'View and manage your subscribed data products.',
      icon: ShoppingCart,
      group: 'Data Products',
      maturity: 'ga',
      showInLanding: false,
    },
    {
      id: 'my-requests',
      name: 'My Requests',
      path: '/my-requests',
      description: 'Track your pending and completed requests.',
      icon: ClipboardList,
      group: 'Data Products',
      maturity: 'ga',
      showInLanding: false,
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      path: '/marketplace',
      description: 'Browse and subscribe to available data products.',
      icon: ShoppingCart,
      group: 'Data Products',
      maturity: 'ga',
      showInLanding: false,
      permissionId: 'data-products',
    },
    {
      id: 'owner-consumers',
      name: 'My Consumers',
      path: '/owner-consumers',
      description: 'View consumers of your data products.',
      icon: Users2,
      group: 'Data Products',
      maturity: 'ga',
      showInLanding: false,
      permissionId: 'data-products',
    },
    // Governance - Standards definition and approval workflows
    {
      id: 'semantic-models',
      name: 'Business Glossary',
      path: '/semantic-models',
      description: 'Explore business glossary terms, concepts, and their relationships.',
      icon: Network,
      group: 'Governance',
      maturity: 'ga',
      showInLanding: true,
    },
    {
      id: 'ontology-search',
      name: 'Concept Search',
      path: '/ontology',
      description: 'Search ontology concepts and properties across semantic models.',
      icon: Brain,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: false,
      permissionId: 'semantic-models',
    },
    {
      id: 'ontology-graph',
      name: 'Concept Graph',
      path: '/ontology-graph',
      description: 'Visualize ontology concepts and their relationships as an interactive graph.',
      icon: Globe2,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: false,
      permissionId: 'semantic-models',
    },
    {
      id: 'assets',
      name: 'Assets',
      path: '/assets',
      description: 'Catalog and manage data and analytics assets with identity, metadata, and relationships.',
      icon: Box,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: true,
    },
    {
      id: 'asset-types',
      name: 'Asset Types',
      path: '/asset-types',
      description: 'Define reusable templates for structuring different kinds of assets.',
      icon: Shapes,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: false,
    },
    {
      id: 'business-roles',
      name: 'Business Roles',
      path: '/business-roles',
      description: 'Manage named roles (e.g., Data Owner) for ownership assignments.',
      icon: Briefcase,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: false,
    },
    {
      id: 'business-owners',
      name: 'Business Owners',
      path: '/business-owners',
      description: 'Track ownership assignments and history across all objects.',
      icon: Users2,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: false,
    },
    {
      id: 'collections',
      name: 'Collections',
      path: '/collections',
      description: 'Organize assets into logical collections.',
      icon: Layers,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: false,
    },
    {
      id: 'hierarchy',
      name: 'Hierarchy Browser',
      path: '/hierarchy',
      description: 'Browse hierarchical relationships between entities.',
      icon: TreePine,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: false,
    },
    {
      id: 'schema-importer',
      name: 'Schema Importer',
      path: '/schema-importer',
      description: 'Import schemas from external sources.',
      icon: FileInput,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: false,
    },
    {
      id: 'data-asset-reviews',
      name: 'Asset Review',
      path: '/data-asset-reviews',
      description: 'Review and approve Databricks assets like tables, views, and functions.',
      icon: ClipboardCheck,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: true,
    },
    {
      id: 'data-catalog',
      name: 'Data Catalog',
      path: '/data-catalog',
      description: 'Browse Unity Catalog assets, search columns, and analyze lineage.',
      icon: BookOpen,
      group: 'Governance',
      maturity: 'beta',
      showInLanding: true,
    },
    // Operations - Ongoing monitoring and technical management
    {
      id: 'compliance',
      name: 'Compliance',
      path: '/compliance',
      description: 'Create, verify compliance rules, and calculate scores.',
      icon: CheckCircle,
      group: 'Operations',
      maturity: 'beta',
      showInLanding: true,
    },
    {
      id: 'process-workflows',
      name: 'Workflows',
      path: '/workflows',
      description: 'Configure automated workflows for validation, approval, and notifications.',
      icon: GitBranch,
      group: 'Operations',
      maturity: 'ga',
      showInLanding: true,
    },
    {
      id: 'estate-manager',
      name: 'Estate Manager',
      path: '/estate-manager',
      description: 'Manage multiple Databricks instances across regions and clouds.',
      icon: Globe,
      group: 'Operations',
      maturity: 'alpha',
      showInLanding: true,
    },
    {
      id: 'master-data',
      name: 'Master Data Management',
      path: '/master-data',
      description: 'Build a golden record of your data.',
      icon: Users,
      group: 'Operations',
      maturity: 'beta',
      showInLanding: true,
    },
    {
      id: 'catalog-commander',
      name: 'Catalog Commander',
      path: '/catalog-commander',
      description: 'Side-by-side catalog explorer for asset management.',
      icon: FolderKanban,
      group: 'Operations',
      maturity: 'ga',
      showInLanding: true,
    },
    // Security
    {
      id: 'security-features',
      name: 'Security Features',
      path: '/security-features',
      description: 'Enable advanced security like differential privacy.',
      icon: Lock,
      group: 'Security',
      maturity: 'alpha',
      showInLanding: true,
    },
    {
      id: 'entitlements',
      name: 'Entitlements',
      path: '/entitlements',
      description: 'Manage access privileges through personas and groups.',
      icon: Shield,
      group: 'Security',
      maturity: 'alpha',
      showInLanding: true,
    },
    {
      id: 'entitlements-sync',
      name: 'Entitlements Sync',
      path: '/entitlements-sync',
      description: 'Synchronize entitlements with external systems.',
      icon: RefreshCw,
      group: 'Security',
      maturity: 'alpha',
      showInLanding: true,
    },
    // access-grants has no standalone view yet; it's embedded in product/contract detail pages
    // System - Application utilities and configuration
    {
      id: 'search',
      name: 'Search',
      path: '/search',
      description: 'Search across data products, contracts, and knowledge graph.',
      icon: Search,
      group: 'System',
      maturity: 'ga',
      showInLanding: false,
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      path: '/audit',
      description: 'View and filter application audit logs.',
      icon: ScrollText,
      group: 'System',
      maturity: 'ga',
      showInLanding: false,
    },
    {
      id: 'settings',
      name: 'Settings',
      path: '/settings',
      description: 'Configure application settings, jobs, and integrations.',
      icon: Settings,
      group: 'System',
      maturity: 'ga',
      showInLanding: false,
    },
    {
      id: 'about',
      name: 'About',
      path: '/about',
      description: 'Information about the application and its features.',
      icon: Info,
      group: 'System',
      maturity: 'ga',
      showInLanding: false,
    },
  ];
  
  // Helper function to get feature by path
  export const getFeatureByPath = (path: string): FeatureConfig | undefined =>
    features.find((feature) => feature.path === path);
  
  // Helper function to get feature name by path (for breadcrumbs)
  export const getFeatureNameByPath = (pathSegment: string): string => {
      const feature = features.find(f => f.path === `/${pathSegment}` || f.path === pathSegment);
      return feature?.name || pathSegment;
  };
  
  // Helper function to group features for navigation
  export const getNavigationGroups = (
      allowedMaturities: FeatureMaturity[] = ['ga']
    ): { name: FeatureGroup; items: FeatureConfig[] }[] => {
      const grouped: { [key in FeatureGroup]?: FeatureConfig[] } = {};
  
      features
        .filter((feature) => allowedMaturities.includes(feature.maturity))
        .forEach((feature) => {
          if (!grouped[feature.group]) {
            grouped[feature.group] = [];
          }
          grouped[feature.group]?.push(feature);
        });
  
      const groupOrder: FeatureGroup[] = ['Data Products', 'Governance', 'Operations', 'Security', 'System'];
  
      return groupOrder
          .map(groupName => ({
              name: groupName,
              items: grouped[groupName] || []
          }))
          .filter(group => group.items.length > 0);
    };
  
  // Helper function to get features for landing pages (Home, About)
  export const getLandingPageFeatures = (
      allowedMaturities: FeatureMaturity[] = ['ga']
  ): FeatureConfig[] => {
      return features.filter(
          (feature) =>
          feature.showInLanding && allowedMaturities.includes(feature.maturity)
      );
  };

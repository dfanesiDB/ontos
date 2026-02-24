import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './components/theme';
import Layout from './components/layout/layout';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { useUserStore } from './stores/user-store';
import { usePermissions } from './stores/permissions-store';
import { useNotificationsStore } from './stores/notifications-store';
import { usePersonaStore } from './stores/persona-store';
import { PERSONA_BASE_PATHS } from './config/persona-nav';
import type { PersonaId } from './types/settings';
import './i18n/config'; // Initialize i18n

// Import views
import Home from './views/home';
import DataDomainsView from './views/data-domains';
import DataProducts from './views/data-products';
import DataProductDetails from './views/data-product-details';
import DataContracts from './views/data-contracts';
import DataContractDetails from './views/data-contract-details';
// Datasets view deprecated — use Asset Explorer instead
// BusinessGlossaryView no longer routed directly (accessed via ontology/glossaries)
import Compliance from './views/compliance';
import CompliancePolicyDetails from './views/compliance-policy-details';
import ComplianceRunDetails from './views/compliance-run-details';
// CreateUcObject no longer routed (will be integrated into persona flows)
import EstateManager from './views/estate-manager';
import EstateDetailsView from './views/estate-details';
import MasterDataManagement from './views/master-data-management';
import SecurityFeatures from './views/security-features';
import Entitlements from './views/entitlements';
import EntitlementsSync from './views/entitlements-sync';
import DataAssetReviews from './views/data-asset-reviews';
import DataAssetReviewDetails from './views/data-asset-review-details';
import DataCatalog from './views/data-catalog';
import DataCatalogDetails from './views/data-catalog-details';
import CatalogCommander from './views/catalog-commander';
// Settings view no longer routed (settings are under /admin/*)
import About from './views/about';
import SettingsGeneralView from './views/settings-general';
import SettingsGitView from './views/settings-git';
import SettingsDeliveryView from './views/settings-delivery';
import SettingsJobsView from './views/settings-jobs';
import SettingsRolesView from './views/settings-roles';
import SettingsTagsView from './views/settings-tags';
import SettingsSearchView from './views/settings-search';
import SettingsMcpView from './views/settings-mcp';
import SettingsUiView from './views/settings-ui';
import SettingsConnectorsView from './views/settings-connectors';
import UserGuide from './views/user-guide';
import DocumentationViewer from './views/documentation-viewer';
import DatabaseSchema from './views/database-schema';
import NotFound from './views/not-found';
import DataDomainDetailsView from "@/views/data-domain-details";
import MyProducts from './views/my-products';
import MyRequests from './views/my-requests';
import SearchView from './views/search';
import TeamsView from './views/teams';
import AuditTrail from './views/audit-trail';
import WorkflowDesignerView from './views/workflow-designer';
import Workflows from './views/workflows';
import OntologySearchView from './views/ontology-search';
import OntologyHomeView from './views/ontology-home';
import BusinessTermsView from './views/business-terms';
import AssetTypesView from './views/asset-types';
import AssetExplorerView from './views/asset-explorer';
import AssetDetailView from './views/asset-detail';
import BusinessRolesView from './views/business-roles';
import BusinessOwnersView from './views/business-owners';
import OwnerConsumersView from './views/owner-consumers';
import CollectionsView from './views/collections';
import SettingsSemanticModelsView from './views/settings-semantic-models';
import HierarchyBrowserView from './views/hierarchy-browser';

/** Syncs the URL prefix to the persona store so direct navigation works. */
function PersonaUrlSync() {
  const { pathname } = useLocation();
  const { currentPersona, setCurrentPersona, allowedPersonas } = usePersonaStore();

  useEffect(() => {
    const entry = (Object.entries(PERSONA_BASE_PATHS) as [PersonaId, string][]).find(
      ([, prefix]) => pathname === prefix || pathname.startsWith(prefix + '/')
    );
    if (entry) {
      const [personaId] = entry;
      if (personaId !== currentPersona && allowedPersonas.includes(personaId)) {
        setCurrentPersona(personaId);
      }
    }
  }, [pathname, currentPersona, setCurrentPersona, allowedPersonas]);

  return null;
}

export default function App() {
  const fetchUserInfo = useUserStore((state: any) => state.fetchUserInfo);
  const { fetchPermissions, fetchAvailableRoles } = usePermissions();
  const { startPolling: startNotificationPolling, stopPolling: stopNotificationPolling } = useNotificationsStore();
  const fetchAllowedPersonas = usePersonaStore((state) => state.fetchAllowedPersonas);

  useEffect(() => {
    console.log("App component mounted, fetching initial user info and permissions...");
    fetchUserInfo();
    fetchPermissions();
    fetchAvailableRoles();
    fetchAllowedPersonas();

    console.log("Starting notification polling...");
    startNotificationPolling();

    return () => {
        console.log("App component unmounting, stopping notification polling...");
        stopNotificationPolling();
    };
  }, [fetchUserInfo, fetchPermissions, fetchAvailableRoles, fetchAllowedPersonas, startNotificationPolling, stopNotificationPolling]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="ucapp-theme">
      <TooltipProvider>
        <Router future={{ 
          v7_relativeSplatPath: true,
          v7_startTransition: true 
        }}>
          <PersonaUrlSync />
          <Layout>
            <Routes>
              {/* Global home */}
              <Route path="/" element={<Home />} />

              {/* === Persona: Data Consumer /consumer === */}
              <Route path="/consumer" element={<Home />} />
              <Route path="/consumer/catalog" element={<DataCatalog />} />
              <Route path="/consumer/catalog/*" element={<DataCatalogDetails />} />
              <Route path="/consumer/glossary" element={<BusinessTermsView />} />
              <Route path="/consumer/my-products" element={<MyProducts />} />
              <Route path="/consumer/my-products/:productId" element={<DataProductDetails />} />
              <Route path="/consumer/requests" element={<MyRequests />} />
              {/* Legacy consumer paths */}
              <Route path="/consumer/lineage" element={<Navigate to="/consumer/catalog" replace />} />

              {/* === Persona: Data Producer /producer (absorbs Data Product Owner) === */}
              <Route path="/producer" element={<Home />} />
              <Route path="/producer/products" element={<DataProducts />} />
              <Route path="/producer/products/:productId" element={<DataProductDetails />} />
              <Route path="/producer/contracts" element={<DataContracts />} />
              <Route path="/producer/contracts/:contractId" element={<DataContractDetails />} />
              <Route path="/producer/assets" element={<AssetExplorerView />} />
              <Route path="/producer/assets/:assetId" element={<AssetDetailView />} />
              <Route path="/producer/quality" element={<Compliance />} />
              <Route path="/producer/quality/policies/:policyId" element={<CompliancePolicyDetails />} />
              <Route path="/producer/quality/runs/:runId" element={<ComplianceRunDetails />} />
              <Route path="/producer/consumers" element={<OwnerConsumersView />} />
              <Route path="/producer/reviews" element={<DataAssetReviews />} />
              <Route path="/producer/reviews/:requestId" element={<DataAssetReviewDetails />} />
              {/* Legacy producer paths */}
              <Route path="/producer/datasets" element={<Navigate to="/producer/assets" replace />} />
              <Route path="/producer/requests" element={<Navigate to="/producer/reviews" replace />} />
              <Route path="/producer/hierarchy" element={<HierarchyBrowserView />} />

              {/* === Legacy: Data Product Owner /owner -> redirect to /producer === */}
              <Route path="/owner" element={<Navigate to="/producer" replace />} />
              <Route path="/owner/*" element={<Navigate to="/producer" replace />} />

              {/* === Persona: Data Steward /steward (absorbs Business Term Owner) === */}
              <Route path="/steward" element={<Home />} />
              <Route path="/steward/assets" element={<AssetExplorerView />} />
              <Route path="/steward/assets/:assetId" element={<AssetDetailView />} />
              <Route path="/steward/catalog" element={<DataCatalog />} />
              <Route path="/steward/catalog/*" element={<DataCatalogDetails />} />
              <Route path="/steward/glossary" element={<BusinessTermsView />} />
              <Route path="/steward/compliance" element={<Compliance />} />
              <Route path="/steward/compliance/policies/:policyId" element={<CompliancePolicyDetails />} />
              <Route path="/steward/compliance/runs/:runId" element={<ComplianceRunDetails />} />
              <Route path="/steward/reviews" element={<DataAssetReviews />} />
              <Route path="/steward/reviews/:requestId" element={<DataAssetReviewDetails />} />
              <Route path="/steward/master-data" element={<MasterDataManagement />} />
              <Route path="/steward/commander" element={<CatalogCommander />} />
              {/* Legacy steward paths */}
              <Route path="/steward/hierarchy" element={<HierarchyBrowserView />} />

              {/* === Persona: Data Governor /governance (absorbs Ontology Engineer) === */}
              <Route path="/governance" element={<Home />} />
              <Route path="/governance/domains" element={<DataDomainsView />} />
              <Route path="/governance/domains/:domainId" element={<DataDomainDetailsView />} />
              <Route path="/governance/teams" element={<TeamsView />} />
              <Route path="/governance/ownership" element={<BusinessOwnersView />} />
              <Route path="/governance/policies" element={<Navigate to="/governance/assets" replace />} />
              <Route path="/governance/glossary" element={<BusinessTermsView />} />
              <Route path="/governance/workflows" element={<Workflows />} />
              <Route path="/governance/workflows/new" element={<WorkflowDesignerView />} />
              <Route path="/governance/workflows/:workflowId" element={<WorkflowDesignerView />} />
              <Route path="/governance/assets" element={<AssetExplorerView />} />
              <Route path="/governance/assets/:assetId" element={<AssetDetailView />} />
              <Route path="/governance/compliance" element={<Compliance />} />
              <Route path="/governance/compliance/policies/:policyId" element={<CompliancePolicyDetails />} />
              <Route path="/governance/compliance/runs/:runId" element={<ComplianceRunDetails />} />
              <Route path="/governance/audit" element={<AuditTrail />} />
              <Route path="/governance/estates" element={<EstateManager />} />
              <Route path="/governance/estates/:estateId" element={<EstateDetailsView />} />
              <Route path="/governance/collections" element={<CollectionsView />} />
              <Route path="/governance/rdf-sources" element={<SettingsSemanticModelsView />} />
              <Route path="/governance/ontology" element={<OntologySearchView />} />
              <Route path="/governance/graph" element={<OntologyHomeView />} />
              <Route path="/governance/kg" element={<OntologySearchView />} />
              <Route path="/governance/asset-types" element={<AssetTypesView />} />
              <Route path="/governance/tags" element={<SettingsTagsView />} />
              {/* Legacy governance paths */}
              <Route path="/governance/projects" element={<Navigate to="/governance/teams" replace />} />
              <Route path="/governance/hierarchy" element={<HierarchyBrowserView />} />
              <Route path="/governance/master-data" element={<Navigate to="/governance/assets" replace />} />

              {/* === Legacy: Ontology Engineer /ontology -> redirect to /governance === */}
              <Route path="/ontology" element={<Navigate to="/governance" replace />} />
              <Route path="/ontology/domains" element={<Navigate to="/governance/domains" replace />} />
              <Route path="/ontology/domains/:domainId" element={<Navigate to="/governance/domains" replace />} />
              <Route path="/ontology/collections" element={<Navigate to="/governance/collections" replace />} />
              <Route path="/ontology/glossaries" element={<Navigate to="/governance/glossary" replace />} />
              <Route path="/ontology/search" element={<Navigate to="/governance/ontology" replace />} />
              <Route path="/ontology/kg" element={<Navigate to="/governance/kg" replace />} />
              <Route path="/ontology/semantic-models-settings" element={<Navigate to="/governance/rdf-sources" replace />} />
              <Route path="/ontology/*" element={<Navigate to="/governance" replace />} />

              {/* === Legacy: Business Term Owner /terms -> redirect to /steward === */}
              <Route path="/terms" element={<Navigate to="/steward" replace />} />
              <Route path="/terms/glossary" element={<Navigate to="/steward/glossary" replace />} />
              <Route path="/terms/requests" element={<Navigate to="/steward/reviews" replace />} />
              <Route path="/terms/*" element={<Navigate to="/steward" replace />} />

              {/* === Persona: Security Officer /security === */}
              <Route path="/security" element={<Home />} />
              <Route path="/security/features" element={<SecurityFeatures />} />
              <Route path="/security/entitlements" element={<Entitlements />} />
              <Route path="/security/sync" element={<EntitlementsSync />} />
              <Route path="/security/audit" element={<AuditTrail />} />

              {/* === Persona: Administrator /admin === */}
              <Route path="/admin" element={<Home />} />
              <Route path="/admin/general" element={<SettingsGeneralView />} />
              <Route path="/admin/ui" element={<SettingsUiView />} />
              <Route path="/admin/jobs" element={<SettingsJobsView />} />
              <Route path="/admin/delivery" element={<SettingsDeliveryView />} />
              <Route path="/admin/git" element={<SettingsGitView />} />
              <Route path="/admin/roles" element={<SettingsRolesView />} />
              <Route path="/admin/business-roles" element={<BusinessRolesView />} />
              <Route path="/admin/business-owners" element={<Navigate to="/governance/ownership" replace />} />
              <Route path="/admin/search" element={<SettingsSearchView />} />
              <Route path="/admin/mcp" element={<SettingsMcpView />} />
              <Route path="/admin/connectors" element={<SettingsConnectorsView />} />
              <Route path="/admin/tags" element={<SettingsTagsView />} />
              <Route path="/admin/audit" element={<AuditTrail />} />
              <Route path="/admin/about" element={<About />} />

              {/* === Global utility routes (no persona prefix) === */}
              <Route path="/search" element={<SearchView />} />
              <Route path="/search/llm" element={<SearchView />} />
              <Route path="/search/index" element={<SearchView />} />
              <Route path="/user-guide" element={<UserGuide />} />
              <Route path="/user-docs/:docName" element={<DocumentationViewer />} />
              <Route path="/database-schema" element={<DatabaseSchema />} />
              <Route path="/about" element={<About />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

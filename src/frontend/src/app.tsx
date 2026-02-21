import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme';
import Layout from './components/layout/layout';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { useUserStore } from './stores/user-store';
import { usePermissions } from './stores/permissions-store';
import { useNotificationsStore } from './stores/notifications-store';
import { usePersonaStore } from './stores/persona-store';
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
import SettingsSemanticModelsView from './views/settings-semantic-models';
import SettingsSearchView from './views/settings-search';
import SettingsMcpView from './views/settings-mcp';
import SettingsUiView from './views/settings-ui';
import UserGuide from './views/user-guide';
import DocumentationViewer from './views/documentation-viewer';
import DatabaseSchema from './views/database-schema';
import NotFound from './views/not-found';
import DataDomainDetailsView from "@/views/data-domain-details";
import MyProducts from './views/my-products';
import MyRequests from './views/my-requests';
import SearchView from './views/search';
import TeamsView from './views/teams';
import ProjectsView from './views/projects';
import AuditTrail from './views/audit-trail';
import WorkflowDesignerView from './views/workflow-designer';
import Workflows from './views/workflows';
import OntologySearchView from './views/ontology-search';
import OntologyHomeView from './views/ontology-home';
import CollectionsView from './views/collections';
import BusinessTermsView from './views/business-terms';
import PoliciesView from './views/policies';
import AssetTypesView from './views/asset-types';
import AssetExplorerView from './views/asset-explorer';
import AssetDetailView from './views/asset-detail';
import BusinessRolesView from './views/business-roles';
import BusinessOwnersView from './views/business-owners';

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
          <Layout>
            <Routes>
              {/* Global home */}
              <Route path="/" element={<Home />} />

              {/* === Persona: Data Consumer /consumer === */}
              <Route path="/consumer" element={<Home />} />
              <Route path="/consumer/my-products" element={<MyProducts />} />
              <Route path="/consumer/my-products/:productId" element={<DataProductDetails />} />
              <Route path="/consumer/lineage" element={<DataCatalog />} />
              <Route path="/consumer/lineage/*" element={<DataCatalogDetails />} />
              <Route path="/consumer/requests" element={<MyRequests />} />

              {/* === Persona: Data Producer /producer === */}
              <Route path="/producer" element={<Home />} />
              <Route path="/producer/products" element={<DataProducts />} />
              <Route path="/producer/products/:productId" element={<DataProductDetails />} />
              <Route path="/producer/datasets" element={<AssetExplorerView />} />
              <Route path="/producer/datasets/:assetId" element={<AssetDetailView />} />
              <Route path="/producer/contracts" element={<DataContracts />} />
              <Route path="/producer/contracts/:contractId" element={<DataContractDetails />} />
              <Route path="/producer/requests" element={<DataAssetReviews />} />
              <Route path="/producer/requests/:requestId" element={<DataAssetReviewDetails />} />

              {/* === Persona: Data Product Owner /owner === */}
              <Route path="/owner" element={<Home />} />
              <Route path="/owner/products" element={<DataProducts />} />
              <Route path="/owner/products/:productId" element={<DataProductDetails />} />
              <Route path="/owner/contracts" element={<DataContracts />} />
              <Route path="/owner/contracts/:contractId" element={<DataContractDetails />} />
              <Route path="/owner/consumers" element={<DataProducts />} />
              <Route path="/owner/health" element={<Compliance />} />
              <Route path="/owner/health/policies/:policyId" element={<CompliancePolicyDetails />} />
              <Route path="/owner/health/runs/:runId" element={<ComplianceRunDetails />} />

              {/* === Persona: Data Steward /steward === */}
              <Route path="/steward" element={<Home />} />
              <Route path="/steward/commander" element={<CatalogCommander />} />
              <Route path="/steward/assets" element={<AssetExplorerView />} />
              <Route path="/steward/assets/:assetId" element={<AssetDetailView />} />
              <Route path="/steward/compliance" element={<Compliance />} />
              <Route path="/steward/compliance/policies/:policyId" element={<CompliancePolicyDetails />} />
              <Route path="/steward/compliance/runs/:runId" element={<ComplianceRunDetails />} />
              <Route path="/steward/reviews" element={<DataAssetReviews />} />
              <Route path="/steward/reviews/:requestId" element={<DataAssetReviewDetails />} />
              <Route path="/steward/master-data" element={<MasterDataManagement />} />

              {/* === Persona: Data Governance Officer /governance === */}
              <Route path="/governance" element={<Home />} />
              <Route path="/governance/domains" element={<DataDomainsView />} />
              <Route path="/governance/domains/:domainId" element={<DataDomainDetailsView />} />
              <Route path="/governance/teams" element={<TeamsView />} />
              <Route path="/governance/projects" element={<ProjectsView />} />
              <Route path="/governance/policies" element={<PoliciesView />} />
              <Route path="/governance/asset-types" element={<AssetTypesView />} />
              <Route path="/governance/assets" element={<AssetExplorerView />} />
              <Route path="/governance/assets/:assetId" element={<AssetDetailView />} />
              <Route path="/governance/tags" element={<SettingsTagsView />} />
              <Route path="/governance/workflows" element={<Workflows />} />
              <Route path="/governance/workflows/new" element={<WorkflowDesignerView />} />
              <Route path="/governance/workflows/:workflowId" element={<WorkflowDesignerView />} />
              <Route path="/governance/master-data" element={<MasterDataManagement />} />
              <Route path="/governance/estates" element={<EstateManager />} />
              <Route path="/governance/estates/:estateId" element={<EstateDetailsView />} />

              {/* === Persona: Security Officer /security === */}
              <Route path="/security" element={<Home />} />
              <Route path="/security/features" element={<SecurityFeatures />} />
              <Route path="/security/entitlements" element={<Entitlements />} />
              <Route path="/security/sync" element={<EntitlementsSync />} />

              {/* === Persona: Ontology Engineer /ontology === */}
              <Route path="/ontology" element={<OntologyHomeView />} />
              <Route path="/ontology/domains" element={<DataDomainsView />} />
              <Route path="/ontology/domains/:domainId" element={<DataDomainDetailsView />} />
              <Route path="/ontology/collections" element={<CollectionsView />} />
              <Route path="/ontology/glossaries" element={<BusinessTermsView />} />
              <Route path="/ontology/concepts" element={<OntologySearchView />} />
              <Route path="/ontology/properties" element={<OntologySearchView />} />
              <Route path="/ontology/ontologies" element={<CollectionsView />} />
              <Route path="/ontology/kg" element={<OntologySearchView />} />
              <Route path="/ontology/semantic-models-settings" element={<SettingsSemanticModelsView />} />

              {/* === Persona: Business Term Owner /terms === */}
              <Route path="/terms" element={<Home />} />
              <Route path="/terms/glossary" element={<BusinessTermsView />} />
              <Route path="/terms/requests" element={<DataAssetReviews />} />
              <Route path="/terms/requests/:requestId" element={<DataAssetReviewDetails />} />

              {/* === Persona: Administrator /admin === */}
              <Route path="/admin" element={<Home />} />
              <Route path="/admin/general" element={<SettingsGeneralView />} />
              <Route path="/admin/git" element={<SettingsGitView />} />
              <Route path="/admin/delivery" element={<SettingsDeliveryView />} />
              <Route path="/admin/jobs" element={<SettingsJobsView />} />
              <Route path="/admin/roles" element={<SettingsRolesView />} />
              <Route path="/admin/tags" element={<SettingsTagsView />} />
              <Route path="/admin/business-roles" element={<BusinessRolesView />} />
              <Route path="/admin/business-owners" element={<BusinessOwnersView />} />
              <Route path="/admin/search" element={<SettingsSearchView />} />
              <Route path="/admin/mcp" element={<SettingsMcpView />} />
              <Route path="/admin/ui" element={<SettingsUiView />} />
              <Route path="/admin/connectors" element={<SettingsGeneralView />} />
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

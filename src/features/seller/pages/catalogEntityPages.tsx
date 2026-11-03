import CatalogFormPage from "./CatalogFormPage";
import CatalogListPage from "./CatalogListPage";
import { CATALOG_ENTITY_CONFIG } from "../config/catalogEntityConfig";

export const SellerBrandListPage = () => (
  <CatalogListPage config={CATALOG_ENTITY_CONFIG.brand} />
);

export const SellerBrandCreatePage = () => (
  <CatalogFormPage config={CATALOG_ENTITY_CONFIG.brand} mode="create" />
);

export const SellerBrandEditPage = () => (
  <CatalogFormPage config={CATALOG_ENTITY_CONFIG.brand} mode="edit" />
);

export const SellerColorListPage = () => (
  <CatalogListPage config={CATALOG_ENTITY_CONFIG.color} />
);

export const SellerColorCreatePage = () => (
  <CatalogFormPage config={CATALOG_ENTITY_CONFIG.color} mode="create" />
);

export const SellerColorEditPage = () => (
  <CatalogFormPage config={CATALOG_ENTITY_CONFIG.color} mode="edit" />
);

export const SellerSizeListPage = () => (
  <CatalogListPage config={CATALOG_ENTITY_CONFIG.size} />
);

export const SellerSizeCreatePage = () => (
  <CatalogFormPage config={CATALOG_ENTITY_CONFIG.size} mode="create" />
);

export const SellerSizeEditPage = () => (
  <CatalogFormPage config={CATALOG_ENTITY_CONFIG.size} mode="edit" />
);

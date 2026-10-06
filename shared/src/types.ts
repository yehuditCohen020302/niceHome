import type {
  AcceptedImageType,
  ProductCategory,
  RoomConstraint,
  RoomType,
  Style,
  StyleChoice,
  UpgradeGoal,
} from './constants';

/** A rectangle in relative image coordinates (0–1). */
export interface RelativeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Location {
  country: string;
  city: string;
}

/** What the user asked for. Shared by the configure form and the Room record. */
export interface RoomPreferences {
  roomType: RoomType;
  goals: UpgradeGoal[];
  /** Things that must stay exactly as they are in the photo. */
  constraints: RoomConstraint[];
  notes?: string;
  location?: Location;
  /** `null` means no budget limit. */
  budget: number | null;
  style: StyleChoice;
}

export interface CreateRoomRequest extends RoomPreferences {
  imageId: string;
}

export interface Room extends RoomPreferences {
  id: string;
  imageId: string;
  imageUrl: string;
  createdAt: string;
}

export interface RoomAnalysis {
  roomId: string;
  detectedObjects: (RelativeBox & { type: string })[];
  freeZones: (RelativeBox & { id: string })[];
  mock: boolean;
}

/** What the planner wants to add — never contains a price, store or concrete product. */
export interface ProductSpec {
  id: string;
  category: ProductCategory;
  description: string;
  style?: Style;
  colors?: string[];
  materials?: string[];
  maxPrice?: number;
  maxDimensionsCm?: Dimensions;
  placementZoneId?: string;
}

export interface Dimensions {
  width?: number;
  height?: number;
  depth?: number;
}

export type Availability = 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown';

export interface Product {
  id: string;
  providerId: string;
  externalId: string;
  gtin?: string;
  name: string;
  description?: string;
  price: number;
  /** True when variants (size, color) have different prices and `price` is the lowest: shown as "החל מ-". */
  priceIsFrom?: boolean;
  currency: string;
  imageUrl: string;
  productUrl: string;
  storeId: string;
  category: ProductCategory;
  colors?: string[];
  materials?: string[];
  /** Style tags from the source, used for ranking. */
  styles?: Style[];
  dimensionsCm?: Dimensions;
  availability: Availability;
  shippingAvailable?: boolean;
  city?: string;
  rating?: number;
  /** ISO timestamp of when price and availability were last verified at the source. */
  lastUpdated: string;
  /** True for any product that is not real. Must be surfaced in the UI. */
  mock: boolean;
}

export interface Store {
  id: string;
  name: string;
  /** Absent when the source does not tell us the store's own site. */
  website?: string;
  logoUrl?: string;
  city?: string;
  address?: string;
  mock: boolean;
}

export interface RankedCandidate {
  productId: string;
  /** 0–1 */
  matchScore: number;
  reason?: string;
}

export interface DesignItem extends Partial<RelativeBox> {
  specId: string;
  productId: string;
  matchScore: number;
  /** Other ranked candidates for the same spec, best first. Used for quick replacement. */
  alternatives: RankedCandidate[];
  /** Hotspot position, relative (0–1). */
  x: number;
  y: number;
  generatedObjectType: string;
}

/**
 * Which implementation produced each pipeline stage.
 * Lets the UI state plainly which parts are mocks or simple rules rather than AI.
 */
export interface DesignPipelineInfo {
  analysis: string;
  planner: string;
  productProviders: string[];
  ranker: string;
  generation: string;
}

export interface Design {
  id: string;
  roomId: string;
  /** `null` while no image generation engine is connected. */
  generatedImageUrl: string | null;
  /** The style actually used (resolved from 'auto' when the user let us choose). */
  style: Style;
  budget: number | null;
  /** Every spec the planner produced, with the price cap that was actually searched. */
  specs: ProductSpec[];
  items: DesignItem[];
  /** Always computed from the selected products, never set by hand. */
  totalPrice: number;
  /** Specs for which no real product matched the constraints. */
  unmatchedSpecs: ProductSpec[];
  pipeline: DesignPipelineInfo;
  /** True when any stage or any product is a mock. */
  mock: boolean;
  createdAt: string;
}

export interface GenerateDesignRequest {
  roomId: string;
}

/** Pipeline stages, in the order they run. */
export const DESIGN_STAGES = ['analyze', 'plan', 'search', 'generate', 'map'] as const;
export type DesignStageId = (typeof DESIGN_STAGES)[number];

/** `skipped` = the stage has no real implementation yet (e.g. no image generator connected). */
export type DesignStageStatus = 'pending' | 'active' | 'done' | 'skipped';

export interface DesignStageProgress {
  id: DesignStageId;
  status: DesignStageStatus;
  /** Item-level progress for the search stage. */
  done?: number;
  total?: number;
}

/** A design being generated in the background, polled by the client for real progress. */
export interface DesignJob {
  id: string;
  roomId: string;
  status: 'running' | 'done' | 'failed';
  stages: DesignStageProgress[];
  designId?: string;
  error?: { code: string; message: string };
}

/** Products and stores referenced by a design, including its alternatives. */
export interface DesignProductsResponse {
  products: Product[];
  stores: Store[];
}

/** A room photo stored on the local server. */
export interface UploadedImage {
  id: string;
  url: string;
  contentType: AcceptedImageType;
  sizeBytes: number;
}

/** Freshness of one product source, so the UI can say what it is showing and how current it is. */
export interface ProductSourceStatus {
  id: string;
  name: string;
  providerId: string;
  /** `syncing` = first download still running; `disabled` = not configured (e.g. missing API key). */
  status: 'ready' | 'syncing' | 'error' | 'disabled';
  products: number;
  /** ISO timestamp of the last successful sync. */
  syncedAt?: string;
}

export interface HealthResponse {
  status: 'ok';
  online: boolean;
  engines: {
    productProviders: string[];
    analysis: string;
    generation: string;
  };
  /** True when any active engine or provider is a mock. */
  mock: boolean;
  /** Which parts are mocks, so the UI can say exactly what is and is not real. */
  mockParts: { products: boolean; analysis: boolean; generation: boolean };
  sources: ProductSourceStatus[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

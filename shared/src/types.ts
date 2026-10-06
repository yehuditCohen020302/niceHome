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
  currency: string;
  imageUrl: string;
  productUrl: string;
  storeId: string;
  category: ProductCategory;
  colors?: string[];
  materials?: string[];
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
  website: string;
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
  alternatives: RankedCandidate[];
  /** Hotspot position, relative (0–1). */
  x: number;
  y: number;
  generatedObjectType: string;
}

export interface Design {
  id: string;
  roomId: string;
  /** `null` while no image generation engine is connected. */
  generatedImageUrl: string | null;
  style: Style;
  items: DesignItem[];
  totalPrice: number;
  unmatchedSpecs: ProductSpec[];
  createdAt: string;
}

/** A room photo stored on the local server. */
export interface UploadedImage {
  id: string;
  url: string;
  contentType: AcceptedImageType;
  sizeBytes: number;
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
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

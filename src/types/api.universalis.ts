export interface ApiPriceInfo {
  itemID: number,
  worldID: number,
  worldName: string,
  listings: ApiListInfo[],
  recentHistory: ApiHistoryInfo[],
  currentAveragePriceNQ: number,
  currentAveragePriceHQ: number,
  averagePriceNQ: number,
  averagePriceHQ: number,
  minPriceNQ: number,
  minPriceHQ: number,
  maxPriceNQ: number,
  maxPriceHQ: number
}
export interface ApiListInfo {
  /**
   * The time that this listing was posted, in seconds since the UNIX epoch.
   * @type {number} int64
   */
  lastReviewTime: number;
  /**
   * The price per unit sold.
   * @type {number} int32
   */
  pricePerUnit: number;
  /**
   * The stack size sold.
   * @type {number} int32
   */
  quantity: number;
  /**
   * The ID of the dye on this item.
   * @type {number} int32
   */
  stainID: number;
  /** The world name, if applicable. */
  worldName?: string;
  /**
   * The world ID, if applicable.
   * @type {number} int32
   */
  worldID?: number;
  /** The creator's character name. */
  creatorName?: string;
  /** A SHA256 hash of the creator's ID. */
  creatorID?: string;
  /** Whether or not the item is high-quality. */
  hq: boolean;
  /** Whether or not the item is crafted. */
  isCrafted: boolean;
  /** The ID of this listing. */
  listingID?: string;
  /** The materia on this item. */
  // materia?: Universalis.Application.Views.V1.MateriaView[];
  /** Whether or not the item is being sold on a mannequin. */
  onMannequin: boolean;
  /**
   * The city ID of the retainer. This is a game ID; all possible values can be seen at
   * https://xivapi.com/Town.
   *
   * Limsa Lominsa = 1
   * Gridania = 2
   * Ul'dah = 3
   * Ishgard = 4
   * Kugane = 7
   * Crystarium = 10
   * Old Sharlayan = 12
   *
   * @type {number} int32
   */
  retainerCity: number;
  /** The retainer's ID. */
  retainerID?: string;
  /** The retainer's name. */
  retainerName?: string;
  /** A SHA256 hash of the seller's ID. */
  sellerID?: string;
  /**
   * The total price.
   * @type {number} int32
   */
  total: number;
  /**
   * The Gil sales tax (GST) to be added to the total price during purchase.
   * @type {number} int32
   */
  tax: number;
}
export interface ApiHistoryInfo {
  /** Whether or not the item was high-quality. */
  hq: boolean;
  /**
   * The price per unit sold.
   * @type {number} int32
   */
  pricePerUnit: number;
  /**
   * The stack size sold.
   * @type {number} int32
   */
  quantity: number;
  /**
   * The sale time, in seconds since the UNIX epoch.
   * @type {number} int64
   */
  timestamp: number;
  /** Whether or not this was purchased from a mannequin. This may be null. */
  onMannequin?: boolean;
  /** The world name, if applicable. */
  worldName?: string;
  /**
   * The world ID, if applicable.
   * @type {number} int32
   */
  worldID?: number;
  /** The buyer name. */
  buyerName?: string;
  /**
   * The total price.
   * @type {number} int32
   */
  total: number;
}
/** Public Meta dataset ID. The Conversions API access token stays server-side. */
export const META_DATASET_ID = "1664861398363916";

export type PublicMetaConfig = {
  enabled: boolean;
  capiEnabled: boolean;
  datasetId: string;
};

export const purchaseEventId = (enrollmentId: number) =>
  `fluentlearner-purchase-${enrollmentId}`;

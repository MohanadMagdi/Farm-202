import { 
  FeedMainType, 
  ConcentratedFeedSubType, 
  SalineMaterialSubType, 
  FeedTypeDefinition,
  FEED_TYPES 
} from '@shared/types';

/**
 * Feed Type Utilities - Unified feed management across the system
 * Utility functions for managing feed types consistently
 */

// Get all available main feed types
export const getMainFeedTypes = (): Array<{value: FeedMainType, label: string}> => {
  return [
    { value: "concentrated", label: "علف مركز" },
    { value: "saline_material", label: "مادة مالحة" }
  ];
};

// Get sub-types for concentrated feed
export const getConcentratedSubTypes = (): Array<{value: ConcentratedFeedSubType, label: string}> => {
  return [
    { value: "14%", label: "علف مركز 14%" },
    { value: "16%", label: "علف مركز 16%" },
    { value: "21%", label: "علف مركز 21%" }
  ];
};

// Get sub-types for saline material
export const getSalineMaterialSubTypes = (): Array<{value: SalineMaterialSubType, label: string}> => {
  return [
    { value: "hay", label: "دريس" },
    { value: "straw", label: "تبن" }
  ];
};

// Get sub-types for a specific main type
export const getSubTypesForMainType = (mainType: FeedMainType) => {
  switch (mainType) {
    case "concentrated":
      return getConcentratedSubTypes();
    case "saline_material":
      return getSalineMaterialSubTypes();
    default:
      return [];
  }
};

// Generate feed ID from main type and sub type
export const generateFeedId = (mainType: FeedMainType, subType: string): string => {
  const mainTypeKey = mainType === "concentrated" ? "concentrated" : "saline";
  const subTypeKey = subType.replace("%", "").toLowerCase();
  return `${mainTypeKey}_${subTypeKey}`;
};

// Get feed definition by ID
export const getFeedDefinitionById = (feedId: string): FeedTypeDefinition | null => {
  return FEED_TYPES[feedId] || null;
};

// Get Arabic name for feed type
export const getFeedArabicName = (mainType: FeedMainType, subType: string): string => {
  const feedId = generateFeedId(mainType, subType);
  const definition = getFeedDefinitionById(feedId);
  return definition?.arabicName || `${getMainFeedTypeLabel(mainType)} - ${subType}`;
};

// Get main type label in Arabic
export const getMainFeedTypeLabel = (mainType: FeedMainType): string => {
  const types = getMainFeedTypes();
  return types.find(t => t.value === mainType)?.label || mainType;
};

// Parse legacy feed type strings to new format
export const parseLegacyFeedType = (legacyType: string): {mainType: FeedMainType, subType: string} | null => {
  const lower = legacyType.toLowerCase();
  
  // Handle concentrated feed
  if (lower.includes('concentrated') || lower.includes('مركز')) {
    if (lower.includes('14')) return { mainType: "concentrated", subType: "14%" };
    if (lower.includes('16')) return { mainType: "concentrated", subType: "16%" };
    if (lower.includes('21')) return { mainType: "concentrated", subType: "21%" };
  }
  
  // Handle saline material / roughage
  if (lower.includes('roughage') || lower.includes('خشن') || lower.includes('مالح')) {
    if (lower.includes('hay') || lower.includes('دريس')) return { mainType: "saline_material", subType: "hay" };
    if (lower.includes('straw') || lower.includes('تبن')) return { mainType: "saline_material", subType: "straw" };
  }
  
  return null;
};

// Convert new format to display string
export const formatFeedTypeForDisplay = (mainType: FeedMainType, subType: string): string => {
  return getFeedArabicName(mainType, subType);
};

// Get all available feed types as options
export const getAllFeedTypeOptions = () => {
  return Object.entries(FEED_TYPES).map(([id, definition]) => ({
    id,
    mainType: definition.mainType,
    subType: definition.subType,
    label: definition.arabicName,
    englishLabel: definition.englishName
  }));
};

// Validate feed type combination
export const isValidFeedTypeCombination = (mainType: FeedMainType, subType: string): boolean => {
  const feedId = generateFeedId(mainType, subType);
  return FEED_TYPES.hasOwnProperty(feedId);
};

// Migration helper: convert old feedType strings to new format
export const migrateFeedType = (oldFeedType: string): string => {
  const parsed = parseLegacyFeedType(oldFeedType);
  if (parsed) {
    return generateFeedId(parsed.mainType, parsed.subType);
  }
  return oldFeedType; // Return as-is if can't parse
};
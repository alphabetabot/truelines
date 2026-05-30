import { isFeatureEnabledSafe } from '../lib/featureFlags'

/**
 * Renders children when a premium flag is on; otherwise optional placeholder.
 * Keeps insertion points ready without shipping paid features.
 */
export default function PremiumFeatureSlot({
  feature,
  children,
  placeholder = null,
}) {
  if (!isFeatureEnabledSafe(feature)) {
    return placeholder
  }
  return children
}

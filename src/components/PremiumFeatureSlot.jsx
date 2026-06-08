import { isFeatureEnabledSafe } from '../lib/featureFlags'
import { useSubscription } from '../hooks/useSubscription'

/**
 * Renders children when a premium flag is on for the subscriber; otherwise optional placeholder.
 */
export default function PremiumFeatureSlot({
  feature,
  children,
  placeholder = null,
}) {
  const { isPremium } = useSubscription()

  if (!isFeatureEnabledSafe(feature, { isPremium })) {
    return placeholder
  }
  return children
}

import { useState } from 'react'
import { FarmersDirectory } from './FarmersDirectory'
import { FarmerProfile } from './FarmerProfile'
import type { Theme } from '../../../lib/useTheme'

export function Farmers({ theme }: { theme: Theme }) {
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null)

  if (selectedFarmerId) {
    return <FarmerProfile farmerId={selectedFarmerId} theme={theme} onBack={() => setSelectedFarmerId(null)} />
  }
  return <FarmersDirectory onSelect={setSelectedFarmerId} />
}

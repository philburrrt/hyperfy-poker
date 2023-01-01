import React from 'react'
import { useSyncState, DEG2RAD } from 'hyperfy'

// TODO:
// * Display each user's remaining money on the table
// * Display each user's current bet on the table
export function Table() {
  return <Community />
}

export function Community() {
  const [community] = useSyncState(state => state.community)
  const groupPos = [-0.075, 1.25, -0.01]
  if (community.length === 0) return null
  return (
    <>
      <billboard axis="y">
        <group position={groupPos} rotation={[DEG2RAD * -45, DEG2RAD * 1, 0]}>
          {community.map((card, i) => (
            <image
              key={i}
              src={`cards/${card}.png`}
              width={0.25}
              position={[0.05 * i, 0, 0.0025 * i]}
            />
          ))}
        </group>
      </billboard>
    </>
  )
}

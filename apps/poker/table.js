import React from 'react'
import { useSyncState, DEG2RAD } from 'hyperfy'

export function Table() {
  return <Community />
}

export function Community() {
  const [community] = useSyncState(state => state.community)
  const [round] = useSyncState(state => state.round)
  const groupPos = [-0.075, 1.25, -0.01]
  if (community.length === 0) return null
  if (round === 'preflop') return null
  return (
    <>
      <billboard axis="y">
        <group position={groupPos} rotation={[DEG2RAD * -25, DEG2RAD * 1, 0]}>
          {community.map((card, i) => (
            <image
              key={i}
              src={`cards/${card}.png`}
              width={0.2}
              position={[0.05 * i, 0.05, 0.0025 * i]}
            />
          ))}
        </group>
      </billboard>
    </>
  )
}

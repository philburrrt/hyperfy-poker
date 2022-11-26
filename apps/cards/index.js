import React, { useState } from 'react'
import { useSyncState, randomInt, DEG2RAD } from 'hyperfy'
import { Hand } from './pokersolver'

export const cards = {
  suits: ['h', 's', 'c', 'd'],
  cards: ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'],
}

export default function Poker() {
  const [user, setUser] = useState({
    uid: null,
    seat: null,
  })

  return (
    <app>
      <model
        src="deck.glb"
        position={[0, 0, 0]}
        scale={0.001}
        rotation={[DEG2RAD * 90, 0, 0]}
      />
    </app>
  )
}

const initialState = {
  deck: [],
  seats: Array(8).fill({
    uid: null,
    hand: [],
    ready: false,
    active: false,
  }),
  turn: {
    round: 0,
    community: [],
  },
  winner: [],
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {},
  }
}

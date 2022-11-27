import React, { useState } from 'react'
import { useSyncState, randomInt, DEG2RAD } from 'hyperfy'
import { Hand } from './pokersolver'
import { UI } from './ui'

//* spec */
//* managing users */
// - 8 seats / 8 possible players
// - octagon shape
// - walk up to any seat, click join if round = 0
// - join method will grab user uid and name
// - uid and name will be assigned to the according seat (key in state object)
//* managing cards */
// - cards are compiled, shuffled and dealt to each player during round 1
// - 3 community cards are dealt during round 2 - another 1 during round 3 - another 1 during round 4
// - winning hand is determined by pokersolver
// - winning hand is calculated during round 5
// - community cards are displayed above each player's cards

export const cards = {
  suits: ['h', 's', 'c', 'd'],
  cards: ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'],
}

export default function Poker() {
  return (
    <app>
      <model
        src="deck.glb"
        position={[0, 0, 0]}
        scale={0.001}
        rotation={[DEG2RAD * 90, 0, 0]}
      />
      <UI />
    </app>
  )
}

const initialState = {
  deck: [],
  seats: Array(8).fill({
    uid: null,
    name: null,
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
    actions: {
      join(state, { idx, uid, name }) {
        state.seats[idx] = { uid, name, ready: false, active: false }
        console.log(`Seat ${idx + 1} joined by ${name} || ${uid}`)
      },
      exit(state, { idx }) {
        state.seats[idx] = {
          uid: null,
          name: null,
          ready: false,
          active: false,
        }
        console.log(`Seat ${idx + 1} is now empty`)
      },
      ready(state, { idx }) {
        state.seats[idx].ready = true
        state.seats[idx].active = true
        console.log(`Seat ${idx + 1} is ready`)

        const active = state.seats.filter(seat => seat.active)
        const ready = state.seats.filter(seat => seat.ready)

        if (active.length === ready.length) {
          if (state.turn.round === 0) {
            state.seats.forEach(seat => {
              seat.ready = false
            })
            state.turn.round = 1
            state.deck = []
            cards.suits.forEach(suit => {
              cards.cards.forEach(card => {
                state.deck.push(`${card}${suit}`)
              })
            })
            state.deck = state.deck.sort(() => randomInt(0, 1) - 0.5)
            Object.values(state.seats).forEach(seat => {
              if (seat.uid) {
                seat.hand = [state.deck.pop(), state.deck.pop()]
              }
            })
            console.log(`Round ${state.turn.round} started`)
          } else if (state.turn.round === 1) {
            state.seats.forEach(seat => {
              seat.ready = false
            })
            state.turn.round = 2
            state.turn.community = [
              state.deck.pop(),
              state.deck.pop(),
              state.deck.pop(),
            ]
            console.log(`Round ${state.turn.round} started`)
          } else if (state.turn.round === 2) {
            state.seats.forEach(seat => {
              seat.ready = false
            })
            state.turn.round = 3
            state.turn.community.push(state.deck.pop())
            console.log(`Round ${state.turn.round} started`)
          } else if (state.turn.round === 3) {
            state.seats.forEach(seat => {
              seat.ready = false
            })
            state.turn.round = 4
            state.turn.community.push(state.deck.pop())
            console.log(`Round ${state.turn.round} started`)
          }
        }
      },
      fold(state, { idx }) {
        state.seats[idx].active = false
        console.log(`Seat ${idx + 1} folded`)
      },
    },
  }
}

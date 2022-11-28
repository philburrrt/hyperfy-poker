import React, { useState, useEffect } from 'react'
import { useSyncState, DEG2RAD } from 'hyperfy'
import { Hand } from './pokersolver'
import { UI } from './ui'
import { Seat } from './seat'

//TODO: when someone exists during round 5, they are able to rejoin before others have left for some reason
//TODO: Round 5, all users are instantly '..waiting' and there is no 'done' button
//TODO: Round 5, there seems to be an invisible button where 'done' should be that removes the user from the game

export const positions = [
  [0, 0, 1.5],
  [1.3, 0, 1.3],
  [1.5, 0, 0],
  [1.3, 0, -1.3],
  [0, 0, -1.5],
  [-1.3, 0, -1.3],
  [-1.5, 0, 0],
  [-1.3, 0, 1.3],
]

export default function Poker() {
  const [user, setUser] = useState({
    seat: null,
    uid: null,
    name: null,
  })
  return (
    <app>
      <model
        src="deck.glb"
        position={[0, 0, 0]}
        scale={0.001}
        rotation={[DEG2RAD * 90, 0, 0]}
      />
      <UI user={user} setUser={setUser} />
      <Seat user={user} setUser={setUser} />
      <Winners />
    </app>
  )
}

export function Winners() {
  const [winner] = useSyncState(state => state.winner)
  const [winningHand] = useSyncState(state => state.winningHand)
  const [seats] = useSyncState(state => state.seats)
  const [turn] = useSyncState(state => state.turn)

  return (
    <>
      {winner && winningHand && turn.round === 5 && (
        <>
          {winner.map((player, idx) => {
            return (
              <billboard key={idx} axis="y" position={[0, 0.2, 0]}>
                <group key={idx}>
                  <text
                    key={idx}
                    value={
                      seats[player].name === 'Anonymous'
                        ? `Seat: ${parseInt(player) + 1}`
                        : seats[player].name
                    }
                    position={
                      winner.length === 1
                        ? [0, 0.1, 0]
                        : [0, 0.1 * (idx + 1), 0]
                    }
                    color="green"
                  />
                </group>
              </billboard>
            )
          })}
          <billboard axis="y" position={[0, 0.2, 0]}>
            <text value={winningHand} color="green" />
          </billboard>
        </>
      )}
    </>
  )
}

const initialState = {
  deck: [],
  seats: Array(8).fill({
    uid: null,
    name: null,
    hand: [],
    handName: null,
    ready: false,
    active: false,
  }),
  turn: {
    round: 0,
    community: [],
  },
  winner: [],
  winningHand: null,
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
          hand: [],
          handName: null,
          ready: false,
          active: false,
        }
        if (state.seats.every(seat => !seat.uid)) {
          state.turn.round = 0
          state.turn.community = []
          state.winner = []
          state.deck = []
          console.log(`All seats empty, resetting game`)
        }
        const seated = Object.keys(state.seats).filter(
          key => state.seats[key].uid
        )
        if (seated.length === 1) {
          state.winner = seated
          state.winningHand = 'Last player standing'
          state.turn.round = 5
          console.log(`One seat left, moving to round 5`)
        }
        console.log(`Seat ${idx + 1} is now empty`)
      },
      deck(state, { deck }) {
        state.deck = deck
      },
      ready(state, { idx }) {
        state.seats[idx].ready = true
        state.seats[idx].active = true
        console.log(`Seat ${idx + 1} is ready`)

        const active = state.seats.filter(seat => seat.active)
        const ready = state.seats.filter(seat => seat.ready)

        if (active.length === ready.length) {
          if (state.turn.round === 0 && active.length != 1) {
            state.seats.forEach(seat => {
              seat.ready = false
            })
            state.turn.round = 1
            Object.values(state.seats).forEach(seat => {
              if (seat.uid) {
                seat.hand = [state.deck.pop(), state.deck.pop()]
              }
            })
            console.log(`All seats ready, starting round 1`)
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
            console.log(`All seats ready, starting round 2`)
          } else if (state.turn.round === 2) {
            state.seats.forEach(seat => {
              seat.ready = false
            })
            state.turn.round = 3
            state.turn.community.push(state.deck.pop())
            console.log(`All seats ready, starting round 3`)
          } else if (state.turn.round === 3) {
            state.seats.forEach(seat => {
              seat.ready = false
            })
            state.turn.round = 4
            state.turn.community.push(state.deck.pop())
            console.log(`All seats ready, starting round 4`)
          } else if (state.turn.round === 4) {
            // make a list of keys of seats that are active
            state.seats.forEach(seat => {
              seat.ready = false
            })
            const activeSeats = Object.keys(state.seats).filter(
              key => state.seats[key].active
            )
            // make a list of hands for each active seat
            const hands = Object.keys(activeSeats).map(key => {
              const seat = state.seats[activeSeats[key]]
              const hand = Hand.solve([...seat.hand, ...state.turn.community])
              return hand
            })
            // assign hand.name to according active seat's handName
            hands.forEach((hand, idx) => {
              state.seats[activeSeats[idx]].handName = hand.name
            })
            // find the best hand
            const bestHand = Hand.winners(hands)
            state.winningHand = bestHand[0].name
            // find the seat(s) with the best hand
            const winners = activeSeats.filter(
              key => state.seats[key].handName === bestHand[0].name
            )
            // assign the winner(s) to state.winner
            state.winner = Object.keys(winners).map(key => winners[key])
            console.log(`Winner(s): ${winners}`)
            console.log(`All seats ready, starting round 5`)
            state.turn.round = 5
          } else if (state.turn.round === 5) {
            // reset game when all users click 'done'
            state.seats.forEach(seat => {
              seat.ready = false
              seat.active = false
              seat.hand = []
              seat.handName = null
            })
            state.turn.round = 0
            state.turn.community = []
            state.winner = []
            state.deck = []
            state.winningHand = null
            console.log(`All seats ready, resetting game`)
          }
        }
      },
      fold(state, { idx }) {
        state.seats[idx].active = false
        console.log(`Seat ${idx + 1} folded`)
        // if only one player is active, set their seat as winner and set round to 5
        const activeSeats = Object.keys(state.seats).filter(
          key => state.seats[key].active
        )
        if (activeSeats.length === 1) {
          state.winner = activeSeats
          state.winningHand = 'Last player standing'
          state.turn.round = 5
          console.log(`One seat left, moving to round 5`)
        }
      },
    },
  }
}

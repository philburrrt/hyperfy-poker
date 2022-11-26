import React, { useState } from 'react'
import { useSyncState, randomInt, DEG2RAD } from 'hyperfy'
import { Join } from './user'
import { Hands, Options, Community, Winner } from './table'
import { Hand } from './pokersolver'

// TODO: One player is showing tie, the other is showing winner
// TODO: Game crashing on second round

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
      <Join user={user} setUser={setUser} />
      <Hands user={user} />
      <Options user={user} />
      <Community />
      <Winner />
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
    id: 0,
    round: 0,
    community: [],
  },
  winner: [],
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {
      join: (state, uid) => {
        const seat = Object.values(state.seats).find(seat => seat.uid === null)
        if (seat) {
          seat.uid = uid
          seat.active = true
        }
      },
      deal: state => {
        state.deck = []
        cards.suits.forEach(suit => {
          cards.cards.forEach(card => {
            state.deck.push({ suit, card })
          })
        })
        state.deck = state.deck.sort(() => randomInt(0, 1) - 0.5)
        Object.values(state.seats).forEach(seat => {
          if (seat.uid) {
            seat.hand = [state.deck.pop(), state.deck.pop()]
          }
        })
      },
      ready: (state, seat) => {
        //* starts game, resets game, and acts as 'call' button
        state.seats[seat].ready = true

        //* If all active players are ready, move to the next round
        if (
          Object.values(state.seats).filter(seat => seat.ready).length ===
          Object.values(state.seats).filter(seat => seat.active).length
        ) {
          //* if there's only one active player, skip to the 5th round (showdown)
          if (
            Object.values(state.seats).filter(seat => seat.active).length ===
              1 &&
            state.turn.round > 0
          ) {
            console.log(`only one player left, moving to round 5`)
            state.turn.round = 5
            if (state.deck.length === 0) {
              cards.suits.forEach(suit => {
                cards.cards.forEach(card => {
                  state.deck.push({ suit, card })
                })
              })
              state.deck = state.deck.sort(() => randomInt(0, 1) - 0.5)
            }
            while (state.turn.community.length < 5) {
              state.turn.community.push(state.deck.pop())
            }
            return
          }
          //* otherwise:
          //* move to the next round
          //* reset ready state
          //* depending on the round, deal the appropriate number of community cards
          //* if showdown is over (round 5), reset the game
          state.turn.round++
          if (state.turn.round === 6) {
            state.turn.round = 0
            state.winner = []
            Object.values(state.seats).forEach(seat => {
              seat.hand = []
              seat.ready = false
            })
            state.turn.community = []
          } else if (state.turn.round === 2) {
            state.turn.community = [
              state.deck.pop(),
              state.deck.pop(),
              state.deck.pop(),
            ]
          } else if (state.turn.round === 3) {
            state.turn.community = [...state.turn.community, state.deck.pop()]
          } else if (state.turn.round === 4) {
            state.turn.community = [...state.turn.community, state.deck.pop()]
          } else if (state.turn.round === 5) {
            // determine winner(s)
            const community = state.turn.community.map(card => {
              return `${card.card}${card.suit}`
            })
            const hands = Object.keys(state.seats)
              .filter(seat => state.seats[seat].active)
              .map(seat => {
                return state.seats[seat].hand.map(card => {
                  return `${card.card}${card.suit}`
                })
              })
            const uids = Object.keys(state.seats)
              .filter(seat => state.seats[seat].active)
              .map(seat => {
                return state.seats[seat].uid
              })
            const results = hands.map(hand => {
              return Hand.solve([...hand, ...community])
            })
            const winner = Hand.winners(results)[0].name
            console.log(`Hand results: ${results.map(result => result.name)}`)
            console.log(winner)
            results.forEach((result, i) => {
              if (result.name === winner) {
                state.winner.push(uids[i])
              }
            })
            console.log(`winner: ${state.winner}`)
          }
          Object.values(state.seats).forEach(seat => {
            seat.ready = false
          })
        }
      },
      fold: (state, seat) => {
        state.seats[seat].hand = []
        state.seats[seat].active = false
      },
      exit: (state, seat) => {
        state.seats[seat].uid = null
        state.seats[seat].hand = []
        state.seats[seat].ready = false
        state.seats[seat].active = false
        //* if all seats are empty, reset game
        if (
          Object.keys(state.seats).every(seat => state.seats[seat].uid === null)
        ) {
          state.turn.round = 0
          state.turn.community = []
          state.deck = []
        }
      },
      reset: state => {
        state.turn.round = 0
        state.turn.community = []
        state.deck = []
        Object.values(state.seats).forEach(seat => {
          seat.uid = null
          seat.hand = []
          seat.ready = false
          seat.active = false
        })
      },
    },
  }
}

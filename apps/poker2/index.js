import React, { useState, useEffect } from 'react'
import { useSyncState, DEG2RAD, useWorld, randomInt } from 'hyperfy'
import { UI } from './ui'
import { Table } from './table'

// TODO:
// * Shuffle and deal cards ('preflop')
// * Solve for winner and distribute pot ('showdown')

export const tiltBack = [DEG2RAD * -35, 0, 0]

const cards = {
  suits: ['h', 's', 'c', 'd'],
  cards: ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'],
}

export default function Poker() {
  const world = useWorld()

  const [user, setUser] = useState({
    seat: null,
    uid: null,
    name: null,
  })

  return (
    <app>
      {world.isServer && <ServerLogic />}
      <model src="poker_table.glb" scale={0.45} position={[0, 0.95, 0]} />
      <Table />
      <Node user={user} setUser={setUser} />
      <Test />
    </app>
  )
}

export function Test() {
  const [time] = useSyncState(state => state.time)
  const [phase] = useSyncState(state => state.phase)
  const [turn] = useSyncState(state => state.turn)

  const info = [
    { label: 'time', value: time },
    { label: 'phase', value: phase },
    { label: 'turn', value: turn },
  ]

  return (
    <>
      {info.map(({ label, value }, i) => (
        <text
          key={i}
          value={`${label}: ${value}`}
          position={[0, 1.75 - 0.05 * i, 0]}
          color="white"
          bgColor="black"
          padding={0.025}
          bgRadius={0.01}
          fontSize={0.05}
        />
      ))}
    </>
  )
}

const positions = [
  [0, 1.25, 1.1],
  [0.8, 1.25, 0.8],
  [1.1, 1.25, 0],
  [0.8, 1.25, -0.8],
  [0, 1.25, -1.1],
  [-0.8, 1.25, -0.8],
  [-1.1, 1.25, 0],
  [-0.8, 1.25, 0.8],
]

export function Node({ user, setUser }) {
  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos} rotation={[0, DEG2RAD * (45 * i), 0]}>
          <panel
            size={[0.5, 0.25]}
            canvasSize={[128, 128]}
            unitSize={1}
            style={{ bg: 'rgba(0,0,0,.2)' }}
            position={[0, -0.01, 0]}
            rotation={tiltBack}
          />
          <UI seat={i} user={user} setUser={setUser} />
        </group>
      ))}
    </>
  )
}

/*
  - idle
  - 2 players join
  - queued
  - active
  - intermission -> preflop -> flop -> turn -> river -> showdown -> intermission
  - during intermission, player hands, the bet amount, and the pot amount are reset
  - turn = first in taken || first in taken after winner
  - players can join during intermission
  - if only 1 player left, game winds down (all variables reset)
*/

const QUEUE_TIME = 2.5
const ENDING_TIME = 10
export function ServerLogic() {
  const world = useWorld()
  const [state, dispatch] = useSyncState(state => state)
  const { phase, turn, players, taken, round, actions } = state

  function getNextRound() {
    if (round === 'intermission') return 'preflop'
    if (round === 'preflop') return 'flop'
    if (round === 'flop') return 'turn'
    if (round === 'turn') return 'river'
    if (round === 'river') return 'showdown'
    if (round === 'showdown') return 'intermission'
  }

  function getNextTurn() {
    const takenSeats = taken.map((taken, i) => {
      if (taken) return i
    })
    console.log('takenSeats', takenSeats)
    const first = state.winner || takenSeats[0]
    console.log('first', first)
    let next
    try {
      next = takenSeats.find(seat => !state.players[seat].action)
      console.log('next', next)
    } catch (e) {
      next = null
    }
    return { first, next }
  }

  function shuffle() {
    const deck = []
    cards.suits.forEach(suit => {
      cards.cards.forEach(card => {
        deck.push(`${card}${suit}`)
      })
    })
    deck.sort(() => randomInt(0, 1) - 0.5)
    return deck
  }

  useEffect(() => {
    // if idle and 2 players join, queue game
    if (phase === 'idle') {
      const taken = state.taken.filter(Boolean)
      if (taken.length > 1) {
        dispatch('setPhase', 'queued', world.getTime())
      }
    }
    // wait QUEUE_TIME seconds, then start game when queued
    if (phase === 'queued') {
      return world.onUpdate(() => {
        const now = world.getTime()
        const elapsed = now - state.time
        if (elapsed > QUEUE_TIME) {
          dispatch('setPhase', 'active')
        }
      })
    }
    // if only 1 player left, game winds down
    if (phase === 'queued' || phase === 'active') {
      const taken = state.taken.filter(Boolean)
      if (taken.length === 1) {
        dispatch('setPhase', 'end', world.getTime())
      }
    }
    if (phase === 'active') {
      if (!round) {
        console.log('New game. Setting round to intermission')
        dispatch('setRound', 'intermission')
      }
    }
    // wait ENDING_TIME seconds, then reset game
    if (phase === 'end') {
      return world.onUpdate(() => {
        const now = world.getTime()
        const elapsed = now - state.time
        if (elapsed > ENDING_TIME) {
          dispatch('setPhase', 'idle')
        }
      })
    }
  }, [phase, taken])

  useEffect(() => {
    if (round === 'intermission') {
      console.log(
        `Round is intermission. Waiting 10 seconds before starting next round`
      )
      dispatch('newRound')
      setTimeout(() => {
        dispatch('setRound', getNextRound())
      }, 10000)
    }

    if (round === 'preflop') {
      const { first } = getNextTurn()
      dispatch('setTurn', first)
      dispatch('deal', shuffle())
    }

    if (round === 'flop' || round === 'turn' || round === 'river') {
      const { next } = getNextTurn()
      dispatch('setTurn', next)
    }

    if (round === 'showdown') {
      dispatch('setTurn', null)
      console.log(
        `Round is showdown. Waiting 10 seconds before starting next round`
      )
      setTimeout(() => {
        dispatch('setRound', getNextRound())
      }, 10000)

      // * solve hands & give winner pot here
    }
  }, [round])

  // determines which player's turn it is after each action taken
  useEffect(() => {
    if (actions == 0) return
    const { next } = getNextTurn()
    console.log(`turn just taken, next is ${next}`)
    if (next === null) {
      dispatch('setRound', getNextRound())
    } else {
      dispatch('setTurn', next)
    }
  }, [actions])

  return null
}

const player = {
  name: null,
  uid: null,
  seat: null,
  action: null,
  money: 0,
  bet: 0,
  time: 0,
  hand: [],
}

const initialState = {
  phase: 'idle', // idle -> queued -> active -> end
  // when phase is active, intermission starts
  round: null, // intermission -> preflop -> flop -> turn -> river -> showdown
  winner: null,
  taken: [false, false, false, false, false, false, false, false],
  pot: 0,
  bet: 0,
  turn: null,
  players: [player, player, player, player, player, player, player, player],
  community: [],
  time: 0,
  actions: 0,
  deck: [],
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {
      join(state, seat, name, uid) {
        state.taken[seat] = true
        state.players[seat] = { name, uid, seat, money: 1000, bet: 0, time: 0 }
        console.log(`Seat ${seat + 1} taken by ${name} (${uid})`)
      },
      leave(state, seat) {
        state.taken[seat] = false
        state.players[seat] = player
      },
      setPhase(state, phase, time = 0) {
        state.phase = phase
        state.time = time
        console.log(`Phase: ${phase}`)
      },
      setRound(state, round) {
        state.actions = 0
        state.round = round
        state.players.forEach((player, i) => {
          state.players[i].action = null
          state.players[i].time = 0
        })
        console.log(`Round: ${round}`)
      },
      newRound(state) {
        state.pot = 0
        state.deck = []
        state.bet = 0
        state.turn = null
        state.community = []
        state.players.forEach((player, i) => {
          state.players[i].bet = 0
          state.players[i].hand = []
        })
        state.actions = 0
      },
      deal(state, deck) {
        state.deck = deck
        state.players.forEach((player, i) => {
          state.players[i].hand = [deck.pop(), deck.pop()]
        })
        state.community = [deck.pop(), deck.pop(), deck.pop()]
        console.log('Dealt cards')
      },
      bet(state, type, seat, amount) {
        if (amount > state.bet) {
          state.bet = amount
        }
        state.players[seat].money -= amount
        state.pot += amount
        state.players[seat].action = type
        console.log(
          `Seat ${seat + 1} - ${type} - ${amount}. now has ${
            state.players[seat].money
          } left`
        )
        state.actions++
      },
      setTurn(state, seat) {
        state.turn = seat
        console.log(`Seat ${seat + 1} is up`)
      },
      fold(state, seat) {
        state.players[seat].bet = 0
        state.players[seat].hand = []
        state.players[seat].action = 'fold'
        state.actions++
        console.log(`Seat ${seat + 1} folded`)
      },
    },
  }
}

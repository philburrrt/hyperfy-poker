import React, { useState, useEffect, Fragment } from 'react'
import { useSyncState, DEG2RAD, useWorld } from 'hyperfy'
import { UI } from './ui'
import { Table } from './table'

// TODO:
// * Add a timer to each turn
// * If no winner, first in taken starts
// * If winner, first in taken after winner starts
// * create start state
// * if next turn is start, move to next round // distribute pot

export const tiltBack = [DEG2RAD * -35, 0, 0]

export default function Poker() {
  const world = useWorld()

  // ! Revert after testing
  // const [user, setUser] = useState({
  //   seat: null,
  //   uid: null,
  //   name: null,
  // })
  const [user, setUser] = useState({
    seat: 0,
    uid: 'player1',
    name: 'Philbert',
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
  const [state, dispatch] = useSyncState(state => state)
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

const QUEUE_TIME = 2.5
const ENDING_TIME = 10
export function ServerLogic() {
  const world = useWorld()
  const [state, dispatch] = useSyncState(state => state)
  const { phase, turn, players, taken } = state

  useEffect(() => {
    if (phase === 'idle') {
      const taken = state.taken.filter(Boolean)
      if (taken.length > 1) {
        dispatch('reset')
        dispatch('setPhase', 'queued', world.getTime())
      }
    }
    if (phase === 'queued') {
      return world.onUpdate(() => {
        const now = world.getTime()
        const elapsed = now - state.time
        if (elapsed > QUEUE_TIME) {
          dispatch('setPhase', 'active')
        }
      })
    }
    if (phase === 'queued' || phase === 'active') {
      const taken = state.taken.filter(Boolean)
      if (taken.length === 1) {
        dispatch('setPhase', 'end', world.getTime())
      }
    }
    if (phase === 'active') {
      if (state.round === null) {
        dispatch('setRound', 'preflop')
      }
    }
    if (phase === 'ending') {
      return world.onUpdate(() => {
        const now = world.getTime()
        const elapsed = now - state.time
        if (elapsed > ENDING_TIME) {
          dispatch('setPhase', 'idle')
        }
      })
    }
  }, [phase, taken])

  // todo: max time limit for turn

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
// ! Revert after testing
const player1 = {
  name: 'Philbert',
  uid: 'player1',
  seat: 0,
  action: null,
  money: 1000,
  bet: 0,
  time: 0,
  hand: [],
}

const player2 = {
  name: 'Player 2',
  uid: 'player2',
  seat: 1,
  action: null,
  money: 1000,
  time: 0,
  hand: [],
}

const initialState = {
  phase: 'idle', // idle -> queued -> active -> end
  round: null,
  winner: null,
  // ! Revert after testing
  // taken: [false, false, false, false, false, false, false, false],
  taken: [true, true, false, false, false, false, false, false],
  pot: 0,
  bet: 0,
  turn: 0,
  // ! Revert after testing
  // players: [player, player, player, player, player, player, player, player],
  players: [player1, player2, player, player, player, player, player, player],
  community: [],
  time: 0,
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
      reset(state) {
        state.pot = 0
        state.turn = 0
        state.community = []
        state.deck = []
        state.winner = null
        state.round = null
        state.players.forEach((player, i) => {
          state.players[i].bet = 0
          state.players[i].action = null
          state.players[i].time = 0
          state.players[i].hand = []
        })
      },
      setPhase(state, phase, time = 0) {
        state.phase = phase
        state.time = time
        console.log(`Phase: ${phase}`)
      },
      setRound(state, round) {
        state.round = round
        // reset player actions
        state.players.forEach((player, i) => {
          state.players[i].action = null
          state.players[i].time = 0
        })
        console.log(`Round: ${round}`)
      },
      bet(state, seat, amount) {
        // if amount == state.bet, then don't add it to bet
        console.log('bet', amount, state.bet)
        if (amount > state.bet) {
          state.bet += amount
        }
        state.players[seat].money -= amount
        state.pot += amount
        console.log(
          `Seat ${seat + 1} bet ${amount} and now has ${
            state.players[seat].money
          } left`
        )
      },
      setTurn(state, seat) {
        state.turn = seat
        console.log(`Seat ${seat + 1} is up`)
      },
      fold(state, seat) {
        state.players[seat].bet = 0
        state.players[seat].hand = []
        state.players[seat].action = 'fold'
        console.log(`Seat ${seat + 1} folded`)
      },
    },
  }
}

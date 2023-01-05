import React, { useState, useEffect, Fragment } from 'react'
import { useSyncState, DEG2RAD, useWorld, randomInt, useFields } from 'hyperfy'
import { UI, InfoBoard } from './ui'
import { Table } from './table'
import { Hand } from './pokersolver'

// TODO:
// * Players might still be able to play after folding (if more than 1 player left)
// * Third player is unable to join

export const tiltBack = [DEG2RAD * -35, 0, 0]

const cards = {
  suits: ['h', 's', 'c', 'd'],
  cards: ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'],
}

export default function Poker() {
  const fields = useFields()
  const world = useWorld()
  const model = fields.model

  const [user, setUser] = useState({
    seat: null,
    uid: null,
    name: null,
  })

  return (
    <app>
      {world.isServer && <ServerLogic />}
      {model && (
        <model src="poker_table.glb" scale={0.45} position={[0, 0.95, 0]} />
      )}
      <Table />
      <Node user={user} setUser={setUser} />
      <Status />
    </app>
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

export function Status() {
  const [status] = useSyncState(state => state.status)
  const [winner] = useSyncState(state => state.winner)

  const info = [
    { lable: 'Status', value: status },
    { lable: 'Winner', value: winner },
  ]

  return (
    <>
      {info.map((info, i) => (
        <Fragment key={i}>
          {info.value && (
            <billboard axis="y" position={[0, 1.7 + i * 0.1, 0]}>
              <text
                value={info.value}
                color="white"
                bgColor="black"
                padding={0.025}
                bgRadius={0.01}
                fontSize={0.05}
              />
            </billboard>
          )}
        </Fragment>
      ))}
    </>
  )
}

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
          <InfoBoard seat={i} />
        </group>
      ))}
    </>
  )
}

export function ServerLogic() {
  const world = useWorld()
  const [state, dispatch] = useSyncState(state => state)
  const { phase, pot, players, taken, round, actions, community, turn } = state
  const [order, setOrder] = useState({
    gameStart: null,
    roundStart: null,
  })
  // * ------------------ UTILS ------------------ *
  function getNextRound() {
    if (round === 'intermission') return 'preflop'
    if (round === 'preflop') return 'flop'
    if (round === 'flop') return 'turn'
    if (round === 'turn') return 'river'
    if (round === 'river') return 'showdown'
    if (round === 'showdown') return 'intermission'
  }

  function getStartingSeat() {
    const takenSeats = taken.reduce((acc, curr, i) => {
      if (curr) acc.push(i)
      return acc
    }, [])
    const lowestSeat = takenSeats[0]
    if (!order.gameStart) {
      setOrder({ ...order, gameStart: lowestSeat, roundStart: lowestSeat })
      return lowestSeat
    } else {
      const nextSeat = takenSeats.find(seat => seat > order.roundStart)
      if (nextSeat) {
        setOrder({ ...order, roundStart: nextSeat })
        return nextSeat
      } else {
        setOrder({ ...order, roundStart: lowestSeat })
        return lowestSeat
      }
    }
  }

  function getNextTurn() {
    const activeHands = getActiveHands()
    const activeSeats = activeHands.map(hand => hand.seat)
    const nextSeat = activeSeats.find(seat => seat > turn)
    if (!nextSeat) {
      const lowestSeat = activeSeats.reduce((a, b) => Math.min(a, b))
      return lowestSeat
    } else {
      return nextSeat
    }
  }

  function getActiveHands() {
    return players
      .filter(player => player.hand.length > 0)
      .map(player => {
        return { seat: player.seat, hand: player.hand }
      })
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

  function floor(num) {
    const floor = num.toString().split('.')[0]
    return parseInt(floor)
  }

  // * ------------------ PHASE SYSTEM ------------------ *
  const QUEUE_TIME = 5
  const ENDING_TIME = 5
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
        dispatch('setRound', 'intermission')
      }
    }
    // wait ENDING_TIME seconds, then reset game
    if (phase === 'end') {
      dispatch('setStatus', 'Shutting down...')
      setTimeout(() => {
        dispatch('reset')
      }, ENDING_TIME * 1000)
    }
  }, [phase, taken])

  // * ------------------ Intermission ------------------ *
  const INTERMISSION_TIME = 5
  const SHOWDOWN_TIME = 5
  useEffect(() => {
    if (round === 'intermission') {
      dispatch('setStatus', 'New round starting...')
      dispatch('newRound')

      function intermission() {
        if (phase !== 'end') {
          dispatch('setRound', getNextRound())
          dispatch('setTurn', getStartingSeat())
          dispatch('setStatus', null)
        }
      }

      const timer = setTimeout(intermission, INTERMISSION_TIME * 1000)
      if (phase === 'end') {
        clearTimeout(timer)
      }
      return () => clearTimeout(timer)
    }

    if (round === 'preflop') {
      dispatch('deal', shuffle())
    }

    // * ------------------ FLOP, TURN, RIVER ------------------ *
    if (round === 'flop' || round === 'turn' || round === 'river') {
    }

    // * ------------------ SHOWDOWN ------------------ *
    if (round === 'showdown') {
      dispatch('setStatus', 'Calculated winner... Distributing pot...')
      dispatch('setTurn', null)
      setTimeout(() => {
        dispatch('setRound', getNextRound())
      }, SHOWDOWN_TIME * 1000)

      const activeHands = getActiveHands()

      const results = activeHands.map(hand => {
        return Hand.solve([...hand.hand, ...community])
      })
      const winner = Hand.winners(results)
      let winners = []

      for (let i = 0; i < results.length; i++) {
        if (results[i].name === winner[0].name) {
          winners.push(activeHands[i].seat)
        }
      }
      const rewardPerWinner = floor(pot / winners.length)
      winners.forEach(seat => {
        dispatch('reward', seat, players[seat].money + rewardPerWinner)
      })
      if (winners.length > 1) return dispatch('setStatus', 'Tie!')
      dispatch('setStatus', `Winner: Player ${winners[0] + 1}`)
    }
  }, [round])

  // * ------------------ PER TURN ------------------ *
  // determines which player's turn it is after each action taken
  useEffect(() => {
    if (actions == 0) return
    // if only one player has cards, set round to showdown
    if (round !== 'showdown' && round !== 'intermission') {
      const activeHands = getActiveHands()
      if (activeHands?.length === 1) {
        dispatch('setRound', 'showdown')
        return
      } else if (activeHands?.length === actions) {
        dispatch('setRound', getNextRound())
        return
      } else {
        dispatch('setTurn', getNextTurn())
      }
    }
  }, [actions])

  // * ------------------ DEBUG ------------------ *

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
  status: null,
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {
      join(state, seat, name, uid) {
        state.taken[seat] = true
        state.players[seat] = { name, uid, seat, money: 1000, bet: 0, time: 0 }
        console.log(`Player ${seat + 1} joined`)
      },
      exit(state, seat) {
        const taken = state.taken.filter(Boolean)
        if (taken.length === 2) state.phase = 'end'
        state.taken[seat] = false
        state.players[seat] = player
      },
      setPhase(state, phase, time = 0) {
        state.phase = phase
        state.time = time
      },
      setRound(state, round) {
        state.actions = 0
        state.round = round
        state.players.forEach((player, i) => {
          state.players[i].action = null
          state.players[i].time = 0
        })
      },
      setStatus(state, status) {
        state.status = status
      },
      reset(state) {
        state.phase = 'idle'
        state.round = null
        state.winner = null
        state.taken = [false, false, false, false, false, false, false, false]
        state.pot = 0
        state.bet = 0
        state.turn = null
        state.players = [
          player,
          player,
          player,
          player,
          player,
          player,
          player,
          player,
        ]
        state.community = []
        state.time = 0
        state.actions = 0
        state.deck = []
        state.status = null
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
          state.players[i].action = null
        })
        state.actions = 0
      },
      reward(state, seat, amount) {
        state.players[seat].money = amount
      },
      setWinner(state, seat) {
        state.winner = seat
      },
      deal(state, deck) {
        state.deck = deck
        state.players.forEach((player, i) => {
          if (player.name) state.players[i].hand = [deck.pop(), deck.pop()]
        })
        state.community = [deck.pop(), deck.pop(), deck.pop()]
      },
      bet(state, type, seat, amount) {
        if (amount > state.bet) {
          state.bet = amount
        }
        state.players[seat].money -= amount
        state.pot += amount
        state.players[seat].action = type
        state.actions++
      },
      setTurn(state, seat) {
        state.turn = seat
      },
      fold(state, seat) {
        state.players[seat].bet = 0
        state.players[seat].hand = []
        state.players[seat].action = 'fold'
        state.actions++
      },
    },
    fields: [
      {
        key: 'model',
        label: 'Model',
        type: 'switch',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
        initial: true,
      },
    ],
  }
}

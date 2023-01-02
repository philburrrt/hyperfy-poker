import React, { useState, useEffect } from 'react'
import { useSyncState, DEG2RAD, useWorld, randomInt } from 'hyperfy'
import { UI, InfoBoard } from './ui'
import { Table } from './table'
import { Hand } from './pokersolver'

// TODO:
// * Test with more players
// * Test with flops
// * Annotate
// * Create a UI for the back of each player's pannel
// - Player number
// - If mid game, it displays their choice of action
// - if in showdown, it displays their hand
// * Ties should show which players are tied
// * Fix player vs seat inconsistency
// * If a player folds and there is only 1 player left, make sure round goes to showdown and phase does not change
// * Exit is not triggering end phase
// * When player 1 vs player 5, preflop skips player 5 turn and moves to flop

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
        <>
          {info.value && (
            <text
              key={i}
              value={info.value}
              position={[0, 1.7 + i * 0.1, 0]}
              color="white"
              bgColor="black"
              padding={0.025}
              bgRadius={0.01}
              fontSize={0.05}
            />
          )}
        </>
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

// todo: add
const QUEUE_TIME = 2.5
export function ServerLogic() {
  const world = useWorld()
  const [state, dispatch] = useSyncState(state => state)
  const { phase, pot, players, taken, round, actions, community } = state
  const [order, setOrder] = useState({
    firstMover: null,
    lastMover: null,
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

  function getNextTurn() {
    const takenSeats = taken.map((taken, i) => {
      if (taken) return i
    })
    const first = state.winner || takenSeats[0]
    let next
    try {
      next = takenSeats.find(seat => !state.players[seat].action)
    } catch (e) {
      next = null
    }
    return { first, next }
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
      setTimeout(() => {
        dispatch('reset')
      }, 1000)
    }
  }, [phase, taken])

  // * ------------------ Intermission ------------------ *
  useEffect(() => {
    if (round === 'intermission') {
      dispatch('setStatus', 'New round starting...')
      const { firstMover } = order
      dispatch('newRound')
      setTimeout(() => {
        dispatch('setRound', getNextRound())
        const { first } = getNextTurn()
        dispatch('setTurn', firstMover ? firstMover : first)
        setOrder({
          firstMover: firstMover ? firstMover : first,
          lastMover: firstMover ? firstMover : first,
        })
        dispatch('setStatus', null)
      }, 5000)
    }

    if (round === 'preflop') {
      dispatch('deal', shuffle())
    }

    // * ------------------ FLOP, TURN, RIVER ------------------ *
    if (round === 'flop' || round === 'turn' || round === 'river') {
      const { lastMover, firstMover } = order
      const nextPlayer = players.find(player => {
        return player.seat > lastMover && player.hand.length > 0
      })
      if (!nextPlayer) {
        dispatch('setTurn', firstMover)
        setOrder({
          firstMover: firstMover,
          lastMover: firstMover,
        })
        return
      }
      dispatch('setTurn', nextPlayer.seat)
      setOrder({
        firstMover: order.firstMover,
        lastMover: nextPlayer.seat,
      })
    }

    // * ------------------ SHOWDOWN ------------------ *
    if (round === 'showdown') {
      dispatch('setStatus', 'Calculated winner... Distributing pot...')
      dispatch('setTurn', null)
      setTimeout(() => {
        dispatch('setRound', getNextRound())
      }, 10000)

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
    const { next } = getNextTurn()
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
  status: null,
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
      exit(state, seat) {
        state.taken[seat] = false
        state.players[seat] = player
        console.log(`Seat ${seat + 1} is now empty`)
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
      setStatus(state, status) {
        state.status = status
        console.log(`Status: ${status}`)
      },
      reset(state) {
        state = initialState
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

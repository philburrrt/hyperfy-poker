import React, { useState, useEffect, Fragment } from 'react'
import { useSyncState, DEG2RAD, useWorld } from 'hyperfy'

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

// TODO:
// * Display each user's remaining money on the table
// * Display each user's current bet on the table
export function Table() {
  return <Community />
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

export function Community() {
  const cards = ['3h', '4h', '5h', '6h', '7h']
  const groupPos = [-0.075, 1.25, -0.01]
  return (
    <>
      <billboard axis="y">
        <group position={groupPos} rotation={[DEG2RAD * -45, DEG2RAD * 1, 0]}>
          {cards.map((card, i) => (
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
const tiltBack = [DEG2RAD * -35, 0, 0]

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

// TODO:
// * Display the current bet
// * Display the current pot
// * Display the current round
// * Display the current turn
// * Display the current player

export function UI({ seat, user, setUser }) {
  const [occupied, dispatch] = useSyncState(state => state.taken[seat])
  const [player] = useSyncState(state => state.players[seat])

  return (
    <>
      <group rotation={tiltBack}>
        <Seat seat={seat} />
        {occupied && user.uid === player.uid && <Hand />}
        {!occupied && <Join seat={seat} setUser={setUser} />}
        {occupied && (
          <>
            <Actions seat={seat} user={user} />
            <PoolInfo seat={seat} />
          </>
        )}
      </group>
    </>
  )
}

export function Join({ seat, setUser }) {
  const world = useWorld()
  const [taken, dispatch] = useSyncState(state => state.taken[seat])

  return (
    <text
      value="Join"
      position={[0, 0.035, 0.01]}
      color="white"
      bgColor="black"
      padding={0.025}
      bgRadius={0.01}
      fontSize={0.05}
      onClick={e => {
        const { uid, name } = e.avatar
        setUser({ seat, uid, name })
        dispatch('join', seat, name, uid)
      }}
    />
  )
}

export function Hand() {
  const fakeHands = [
    ['3h', '4h'],
    ['5h', '6h'],
    ['7h', '8h'],
    ['9h', '10h'],
    ['Jh', 'Qh'],
    ['Kh', 'Ah'],
    ['2h', '2h'],
    ['3h', '3h'],
  ]

  return (
    <>
      {fakeHands.map((hand, i) => (
        <group key={i} position={[-0.175, -0.025, 0]}>
          {hand.map((card, i) => (
            <image
              key={i}
              src={`cards/${card}.png`}
              width={0.1}
              position={[0.05 * i, 0, 0.0025 * i]}
            />
          ))}
        </group>
      ))}
    </>
  )
}

export function Seat({ seat }) {
  // all public info
  const [player] = useSyncState(state => state.players[seat])
  const name = player.name ? player.name : null
  const time = player.time ? player.time : 0

  return (
    <>
      <text
        value={`Seat: ${seat + 1}`}
        position={[0, 0.1, 0.0025]}
        color="white"
        fontSize={0.02}
        bgColor="black"
        padding={0.01}
        bgRadius={0.01}
      />
      {name !== null && (
        <text
          value={`Player: ${name}`}
          position={[-0.15, 0.1, 0.0025]}
          color="white"
          fontSize={0.02}
          bgColor="black"
          padding={0.01}
          bgRadius={0.01}
        />
      )}
      {time !== 0 && (
        <text
          value={`Time: ${time}`}
          position={[0.15, 0.1, 0.0025]}
          color="white"
          fontSize={0.02}
          bgColor="black"
          padding={0.01}
          bgRadius={0.01}
        />
      )}
    </>
  )
}

export function Actions({ seat, user }) {
  const [turn, dispatch] = useSyncState(state => state.turn)
  const [taken] = useSyncState(state => state.taken)
  const [bet] = useSyncState(state => state.bet)
  // fold, call or raise
  const buttons = [
    { value: 'Fold', action: 'fold' },
    { value: 'Call', action: 'call' },
    { value: 'Raise', action: 'raise' },
  ]
  return (
    <>
      <group key={seat} position={[0, -0.05, 0.01]}>
        {buttons.map((button, i) => (
          <text
            key={i}
            value={button.value}
            position={[0, 0.045 * i, 0]}
            color="white"
            bgColor="black"
            fontSize={0.02}
            padding={0.01}
            bgRadius={0.01}
            onClick={() => {
              if (seat !== turn) return console.log('not your turn')
              if (seat !== user.seat) return console.log('not your seat')
              if (button.action === 'fold') dispatch('fold', seat)
              let amount
              if (bet === 0) {
                amount = 3
              } else if (bet === 3) {
                amount = 6
              } else {
                amount = bet
              }
              if (button.action === 'call') dispatch('bet', seat, amount)
              if (button.action === 'raise') dispatch('bet', seat, amount * 2)
              // next seat
              let next = taken.indexOf(true, seat + 1)
              if (next === -1) next = taken.indexOf(true)
              dispatch('setTurn', next)
            }}
          />
        ))}
      </group>
    </>
  )
}

export function PoolInfo({ seat }) {
  // current pot
  // player's bet
  // player's money
  const [player] = useSyncState(state => state.players[seat])
  if (!player) return null
  const [pot] = useSyncState(state => state.pot)
  const [turn] = useSyncState(state => state.turn)
  const [bet] = useSyncState(state => state?.bet || 0)
  const { money } = player

  const info = [
    { Label: 'Pot', Value: pot },
    { Label: 'Bet', Value: bet },
    { Label: 'Money', Value: money },
    { Label: 'Turn', Value: `Seat ${turn + 1}` },
  ]

  return (
    <>
      <group position={[0.15, -0.08, 0]}>
        {info.map((item, i) => (
          <text
            key={i}
            value={`${item.Label}: ${item.Value}`}
            position={[0, 0.045 * i, 0]}
            color="white"
            bgColor="black"
            fontSize={0.02}
            padding={0.01}
            bgRadius={0.01}
          />
        ))}
      </group>
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

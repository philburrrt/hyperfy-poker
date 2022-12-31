import React, { useState, useEffect, Fragment } from 'react'
import { useSyncState, DEG2RAD, useWorld } from 'hyperfy'

export default function Poker() {
  // const [user, setUser] = useState({
  //   seat: null,
  //   uid: null,
  //   name: null,
  // })

  // ! delete after testing
  const [user, setUser] = useState({
    seat: 0,
    uid: 'test',
    name: 'test',
  })

  return (
    <app>
      <model src="poker_table.glb" scale={0.45} position={[0, 0.95, 0]} />
      <Table />
      <Node user={user} setUser={setUser} />
    </app>
  )
}

// TODO:
// * Display each user's remaining money on the table
// * Display each user's current bet on the table
export function Table() {
  return <Community />
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
        {!occupied && <Join seat={seat} user={user} setUser={setUser} />}
        {occupied && (
          <>
            <Actions />
            <Bet seat={seat} />
          </>
        )}
      </group>
    </>
  )
}

export function Join({ seat, user, setUser }) {
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
  // seat number
  // player name
  // player time remaining
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

export function Actions() {
  // fold, call or raise
  const buttons = ['Fold', 'Call', 'Raise']
  return (
    <>
      <group position={[0, -0.05, 0.01]}>
        {buttons.map((button, i) => (
          <text
            key={i}
            value={button}
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

export function Bet({ seat }) {
  // current pot
  // player's bet
  // player's money
  const [player] = useSyncState(state => state.players[seat])
  if (!player) return null
  const [pot] = useSyncState(state => state.pot)
  const [turn] = useSyncState(state => state.turn)
  const { bet, money } = player

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

const player = {
  name: null,
  uid: null,
  seat: null,
  money: 0,
  bet: 0,
  time: 0,
  hand: [],
}

const initialState = {
  taken: [false, false, false, false, false, false, false, false],
  pot: 0,
  turn: 0,
  players: [player, player, player, player, player, player, player, player],
  community: [],
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {
      join(state, seat, name, uid) {
        state.taken[seat] = true
        state.players[seat] = { name, uid, seat, money: 1000, bet: 0, time: 0 }
      },
    },
  }
}

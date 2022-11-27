import React, { useState } from 'react'
import { useWorld, useSyncState, DEG2RAD } from 'hyperfy'

// 8 seats with join button
// join -> ready -> call / fold -> next round

const positions = [
  [0, 0, 1.5],
  [1.3, 0, 1.3],
  [1.5, 0, 0],
  [1.3, 0, -1.3],
  [0, 0, -1.5],
  [-1.3, 0, -1.3],
  [-1.5, 0, 0],
  [-1.3, 0, 1.3],
]

// round 0 = join || ready
// round 1 = 2 cards, call / fold for seats with active players
// round 2 = 2 cards, call / fold and 3 community cards for seats with active players

export function UI() {
  const [turn] = useSyncState(state => state.turn)
  const [seats] = useSyncState(state => state.seats)
  const [user, setUser] = useState({
    seat: null,
    uid: null,
    name: null,
  })

  return (
    <>
      {positions.map((pos, idx) => {
        if (user.seat !== null && user.seat !== idx) return null
        return (
          <group position={pos} rotation={[0, DEG2RAD * 45 * idx, 0]}>
            {turn.round === 0 && !seats[idx].uid && (
              <Join idx={idx} user={user} setUser={setUser} />
            )}
            {seats[idx].uid && <Exit idx={idx} setUser={setUser} />}
            {turn.round === 0 && seats[idx].uid && !seats[idx].ready && (
              <Ready idx={idx} />
            )}
            {/* <text value={`Seat: ${idx + 1}`} position={[0, -0.4, 0]} /> */}
            <Name idx={idx} user={user} />
            {turn.round > 0 && !seats[idx].ready && seats[idx].active && (
              <Options idx={idx} />
            )}
          </group>
        )
      })}
    </>
  )
}

export function Name({ idx, user }) {
  return (
    <>
      {!user.name || user.name === 'Anonymous' ? (
        <text value={`Seat: ${idx + 1}`} position={[0, -0.4, 0]} />
      ) : (
        <text value={user.name} position={[0, -0.4, 0]} />
      )}
    </>
  )
}

export function Options({ idx }) {
  const [turn, dispatch] = useSyncState(state => state.turn)

  return (
    <>
      <text
        value="Call"
        position={[0, -0.1, 0]}
        onClick={() => dispatch('ready', idx)}
      />
      <text
        value="Fold"
        position={[0, -0.2, 0]}
        onClick={() => dispatch('fold', idx)}
      />
    </>
  )
}

export function Join({ idx, user, setUser }) {
  const [seats, dispatch] = useSyncState(state => state.seats)

  return (
    <text
      value="Join"
      onClick={e => {
        const { uid, name } = e.avatar
        setUser({ seat: idx, uid, name })
        dispatch('join', { idx, uid, name })
      }}
    />
  )
}

export function Ready({ idx }) {
  const [seats, dispatch] = useSyncState(state => state.seats)

  return (
    <text
      value="Ready"
      position={[0, -0.2, 0]}
      onClick={() => {
        dispatch('ready', { idx })
      }}
    />
  )
}

export function Exit({ idx, setUser }) {
  const [seats, dispatch] = useSyncState(state => state.seats)

  return (
    <>
      <text
        value="Exit"
        position={[0, -0.3, 0]}
        onClick={() => {
          dispatch('exit', { idx })
          setUser({ seat: null, uid: null, name: null })
        }}
      />
      {seats[idx].ready && <text value="...Waiting" position={[0, -0.2, 0]} />}
    </>
  )
}

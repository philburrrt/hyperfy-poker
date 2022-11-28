import React, { useEffect } from 'react'
import { useSyncState, DEG2RAD, useServer } from 'hyperfy'
import { positions } from './index'

export function UI({ user, setUser }) {
  const [turn] = useSyncState(state => state.turn)
  const [seats] = useSyncState(state => state.seats)

  return (
    <>
      {positions.map((pos, idx) => {
        if (seats[idx].uid && seats[idx].uid !== user.uid) return null
        return (
          <group key={idx} position={pos} rotation={[0, DEG2RAD * 45 * idx, 0]}>
            {seats[idx].uid && <Exit idx={idx} setUser={setUser} />}
            {turn.round === 0 && seats[idx].uid && !seats[idx].ready && (
              <Ready idx={idx} />
            )}
            {turn.round > 0 && !seats[idx].ready && seats[idx].active && (
              <Options idx={idx} />
            )}
            {seats[idx].hand && seats[idx].hand.length > 0 && (
              <Hands idx={idx} />
            )}
          </group>
        )
      })}
    </>
  )
}

export function Options({ idx }) {
  const [turn, dispatch] = useSyncState(state => state.turn)

  return (
    <>
      <text
        value={turn.round < 5 ? 'Call' : 'Done'}
        position={[0, -0.1, 0]}
        onClick={() => {
          dispatch('ready', { idx })
        }}
        bgColor={'black'}
        color={'white'}
        padding={0.02}
        bgRadius={0.02}
      />
      {turn.round < 5 && (
        <text
          value="Fold"
          position={[0, -0.2, 0]}
          onClick={() => dispatch('fold', { idx })}
          bgColor={'black'}
          color={'white'}
          padding={0.02}
          bgRadius={0.02}
        />
      )}
    </>
  )
}

export function Ready({ idx }) {
  const [turn, dispatch] = useSyncState(state => state.seats)

  return (
    <text
      value="Ready"
      position={[0, -0.2, 0]}
      onClick={() => {
        dispatch('ready', { idx })
      }}
      bgColor={'black'}
      color={'white'}
      padding={0.02}
      bgRadius={0.02}
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
        bgColor={'black'}
        color={'white'}
        padding={0.02}
        bgRadius={0.02}
      />
      {seats[idx].ready && (
        <text
          value="...Waiting"
          position={[0, -0.2, 0]}
          bgColor={'black'}
          color={'white'}
          padding={0.02}
          bgRadius={0.02}
        />
      )}
    </>
  )
}

export function Hands({ idx }) {
  const [seats] = useSyncState(state => state.seats)
  const [turn] = useSyncState(state => state.turn)
  const hand = seats[idx].hand
  const community = turn.community
  return (
    <>
      {hand.map((card, idx) => (
        <image
          key={idx}
          src={`cards/${card}.png`}
          scale={0.15}
          frameWidth={0.01}
          frameColor={'blue'}
          position={[0.03 * (idx - 2.5), 0, idx * 0.005]}
        />
      ))}
      {community.map((card, idx) => (
        <image
          key={idx}
          src={`cards/${card}.png`}
          scale={0.15}
          frameWidth={0.01}
          frameColor={'blue'}
          position={[0.03 * (idx - 0.5), 0, (idx + 2) * 0.005]}
        />
      ))}
    </>
  )
}

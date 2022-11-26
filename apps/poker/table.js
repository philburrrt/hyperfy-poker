import React, { useEffect } from 'react'
import { useSyncState, DEG2RAD, useWorld } from 'hyperfy'

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

export function Hands({ user }) {
  const [seats] = useSyncState(state => state.seats)
  const hand = seats[user.seat]?.hand

  return (
    <>
      {hand && hand.length > 0 && (
        <>
          {hand.map((i, idx) => {
            const card = `${i.card}${i.suit}`
            return (
              <group
                rotation={[0, DEG2RAD * 45 * user.seat, 0]}
                position={positions[user.seat]}
              >
                <image
                  key={idx}
                  src={`cards/${card}.png`}
                  position={idx === 0 ? [-0.075, 0, 0] : [0.075, 0, 0]}
                  scale={0.15}
                  frameWidth={0.01}
                  frameColor={'blue'}
                />
              </group>
            )
          })}
        </>
      )}
    </>
  )
}

export function Community() {
  const [community] = useSyncState(state => state.turn.community)

  return (
    <>
      {community && community.length > 0 && (
        <>
          {community.map((i, idx) => {
            // i = card object, idx = index of card in hand
            const card = `${i.card}${i.suit}`
            return (
              <billboard axis="y">
                <group>
                  <image
                    key={idx}
                    src={`cards/${card}.png`}
                    position={[-0.5 + idx * 0.25, 0.5, 0]}
                    scale={0.3}
                    frameWidth={0.01}
                    frameColor={'blue'}
                  />
                </group>
              </billboard>
            )
          })}
        </>
      )}
    </>
  )
}

export function Winner({ user }) {
  const [winner] = useSyncState(state => state.winner)

  return (
    <>
      {winner && winner.length > 0 && (
        <>
          <billboard axis="y">
            <text
              value={
                winner.length > 1
                  ? `Tie between ${winner.toString()}`
                  : `Winner is ${winner[0]}`
              }
              color="white"
              bgColor="black"
              fontSize={0.2}
              position={[0, 1, 0]}
            />
          </billboard>
        </>
      )}
    </>
  )
}

export function Options({ user }) {
  const [turn, dispatch] = useSyncState(state => state.turn)
  const [seats] = useSyncState(state => state.seats)
  const world = useWorld()

  useEffect(() => {
    if (!world.isServer) return
    if (turn.round === 1) {
      dispatch('deal')
    }
  }, [turn.round])

  return (
    <>
      {user.seat && turn.round !== 0 && (
        <>
          {Object.keys(seats).map(i => (
            <>
              {seats[i].uid === user.uid && seats[i].ready === false && (
                <text
                  key={i}
                  value={turn.round === 5 ? 'Done' : 'Call'}
                  position={[
                    positions[i][0],
                    positions[i][1] - 0.1,
                    positions[i][2],
                  ]}
                  rotation={[0, DEG2RAD * 45 * i, 0]}
                  color="white"
                  bgColor="black"
                  padding={0.01}
                  bgRadius={0.01}
                  onClick={() => dispatch('ready', user.seat)}
                />
              )}
            </>
          ))}
          {Object.keys(seats).map(i => (
            <>
              {seats[i].uid === user.uid && seats[i].ready === false && (
                <text
                  key={i}
                  value={'Fold'}
                  position={[
                    positions[i][0],
                    positions[i][1] - 0.2,
                    positions[i][2],
                  ]}
                  rotation={[0, DEG2RAD * 45 * i, 0]}
                  color="white"
                  bgColor="black"
                  padding={0.01}
                  bgRadius={0.01}
                  onClick={() => dispatch('fold', user.seat)}
                />
              )}
            </>
          ))}
        </>
      )}
      {user.seat && turn.round === 0 && (
        <>
          {Object.keys(seats).map(i => (
            <>
              {seats[i].uid === user.uid && (
                <text
                  key={i}
                  value={'Ready'}
                  position={[
                    positions[i][0],
                    positions[i][1] - 0.1,
                    positions[i][2],
                  ]}
                  rotation={[0, DEG2RAD * 45 * i, 0]}
                  color="white"
                  bgColor="black"
                  padding={0.01}
                  bgRadius={0.01}
                  onClick={() => dispatch('ready', user.seat)}
                />
              )}
            </>
          ))}
        </>
      )}
    </>
  )
}

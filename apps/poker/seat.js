import React, { useEffect } from 'react'
import { useWorld, useSyncState, DEG2RAD, randomInt } from 'hyperfy'
import { positions } from './index'

const cards = {
  suits: ['h', 's', 'c', 'd'],
  cards: ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'],
}

//* There might be another condition that is causing 'Join' to be displayed outside of round 0

export function Seat({ user, setUser }) {
  const [turn, dispatch] = useSyncState(state => state.turn)
  const world = useWorld()

  useEffect(() => {
    if (!world.isServer) return
    if (turn.round === 0) {
      const deck = []
      cards.suits.forEach(suit => {
        cards.cards.forEach(card => {
          deck.push(`${card}${suit}`)
        })
      })
      deck.sort(() => randomInt(0, 1) - 0.5)
      dispatch('deck', { deck })
    }
  }, [turn.round])

  return (
    <>
      {positions.map((pos, idx) => {
        return (
          <group key={idx} position={pos} rotation={[0, DEG2RAD * 45 * idx, 0]}>
            <Name idx={idx} user={user} />
            {user.seat === null && (
              <Join
                idx={idx}
                user={user}
                setUser={setUser}
                round={turn.round}
              />
            )}
            <Results idx={idx} />
          </group>
        )
      })}
    </>
  )
}

export function Results({ idx }) {
  const [seats] = useSyncState(state => state.seats)
  const [winningHand] = useSyncState(state => state.winningHand)

  return (
    <>
      {seats[idx].handName && winningHand && (
        <text
          value={seats[idx].handName}
          position={[0, -0.5, 0]}
          color={seats[idx].handName === winningHand ? 'green' : 'red'}
          bgColor={'black'}
          padding={0.02}
          bgRadius={0.02}
        />
      )}
    </>
  )
}

export function Name({ idx }) {
  const [seats] = useSyncState(state => state.seats)
  const name = seats[idx].name
  return (
    <>
      {!name || name === 'Anonymous' ? (
        <text
          value={`Seat: ${idx + 1}`}
          position={[0, -0.4, 0]}
          bgColor={'black'}
          color={'white'}
          padding={0.02}
          bgRadius={0.02}
        />
      ) : (
        <text
          value={name}
          position={[0, -0.4, 0]}
          bgColor={'black'}
          color={'white'}
          padding={0.02}
          bgRadius={0.02}
        />
      )}
    </>
  )
}

export function Join({ idx, setUser, round }) {
  const [seats, dispatch] = useSyncState(state => state.seats)
  const taken = seats[idx].uid !== null

  return (
    <>
      {round === 0 && !taken && (
        <text
          value="Join"
          onClick={e => {
            const { uid, name } = e.avatar
            setUser({ seat: idx, uid, name })
            dispatch('join', { idx, uid, name })
          }}
          bgColor={'black'}
          color={'white'}
          padding={0.02}
          bgRadius={0.02}
        />
      )}
    </>
  )
}

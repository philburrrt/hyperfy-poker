import React from 'react'
import { useSyncState, useWorld } from 'hyperfy'
import { tiltBack } from '.'

export function UI({ seat, user, setUser }) {
  const [occupied] = useSyncState(state => state.taken[seat])
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
  const [round, dispatch] = useSyncState(state => state.taken[seat])

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
    </>
  )
}

export function Actions({ seat, user }) {
  const [bet, dispatch] = useSyncState(state => state.bet)
  const [turn] = useSyncState(state => state?.turn)
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
              if (turn == null) return console.log('not active')
              if (turn && seat !== turn) return console.log('not your turn')
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
              if (button.action === 'call')
                dispatch('bet', button.action, seat, amount)
              if (button.action === 'raise')
                dispatch('bet', button.action, seat, amount * 2)
              if (button.action === 'fold') dispatch('fold', seat)
            }}
          />
        ))}
      </group>
    </>
  )
}

export function PoolInfo({ seat }) {
  const [player] = useSyncState(state => state.players[seat])
  if (!player) return null
  const [pot] = useSyncState(state => state.pot)
  const [turn] = useSyncState(state => state?.turn)
  const [bet] = useSyncState(state => state?.bet || 0)
  const [round] = useSyncState(state => state?.round || 'waiting')
  const { money } = player

  const info = [
    { Label: 'Pot', Value: pot },
    { Label: 'Bet', Value: bet },
    { Label: 'Money', Value: money },
    { Label: 'Turn', Value: turn != null ? `Player ${turn + 1}` : 'none' },
    { Label: 'Round', Value: round },
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

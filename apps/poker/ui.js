import React from 'react'
import { useSyncState, useWorld, DEG2RAD } from 'hyperfy'
import { tiltBack } from '.'

// Sits inside of a Node. UI _behind_ each seat.
// Displays the action a player last took
// Displays the seat number
// Displays the player's name
// Displays their cards during showdown
export function InfoBoard({ seat }) {
  const [player] = useSyncState(state => state.players[seat])
  const [round] = useSyncState(state => state.round)
  const [occupied] = useSyncState(state => state.taken[seat])
  const { name, action, hand } = player
  return (
    // rotate grouop 180 degrees
    <group rotation={[0, DEG2RAD * 180, 0]}>
      <text
        value={`Player: ${seat + 1}`}
        position={[0, 0.095, 0.1]}
        color="white"
        fontSize={0.035}
        bgColor="black"
        padding={0.01}
        bgRadius={0.01}
      />
      {name && (
        <text
          value={name}
          position={[0, 0.065, 0.1]}
          color="white"
          fontSize={0.035}
          bgColor="black"
          padding={0.01}
          bgRadius={0.01}
        />
      )}
      {action && (
        <text
          value={`${action.charAt(0).toUpperCase()}${action.slice(1)}`}
          position={[0, 0.03, 0.1]}
          color="white"
          fontSize={0.035}
          bgColor="black"
          padding={0.01}
          bgRadius={0.01}
        />
      )}
      {hand && round === 'showdown' && (
        <group position={[-0.02, -0.05, 0.1]} rotation={tiltBack}>
          {hand.map((card, i) => (
            <image
              key={i}
              src={`cards/${card}.png`}
              width={0.075}
              position={[0.05 * i, 0, i * 0.0025]}
            />
          ))}
        </group>
      )}
    </group>
  )
}

// Sits inside of a Node. UI _in front_ each seat.
export function UI({ seat, user, setUser }) {
  const [occupied] = useSyncState(state => state.taken[seat])

  return (
    <>
      <group rotation={tiltBack}>
        <Seat seat={seat} />
        <Exit seat={seat} user={user} />
        {user?.seat === seat && <Hand seat={seat} />}
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

// Shows if seat is not taken
// Can click if phase == idle or round == intermission
export function Join({ seat, setUser }) {
  const world = useWorld()
  const [round, dispatch] = useSyncState(state => state.taken[seat])
  const [phase] = useSyncState(state => state.phase)

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
        console.log('phase', phase)
        console.log('round', round)
        if (
          phase === 'idle' ||
          phase === 'queued' ||
          round === 'intermission'
        ) {
          const { uid, name } = e.avatar
          console.log(`Joining seat ${seat} as ${name}`)
          setUser({ seat, uid, name })
          console.log('setting user')
          dispatch('join', seat, name, uid)
          console.log(`Dispatched join to seat ${seat} as ${name}`)
        }
      }}
    />
  )
}

// Always shows.
// Only works if player occupies the seat
export function Exit({ seat, user }) {
  const [player, dispatch] = useSyncState(state => state.players[seat])

  return (
    <text
      value="Exit"
      position={[0, -0.1, 0.01]}
      color="white"
      bgColor="black"
      padding={0.015}
      bgRadius={0.015}
      fontSize={0.015}
      onClick={() => {
        if (user?.seat !== seat) return console.log('not your seat')
        dispatch('exit', seat)
      }}
    />
  )
}

// Shows hand to user who occupies the seat
export function Hand({ seat }) {
  const [hand] = useSyncState(state => state.players[seat].hand)
  return (
    <>
      {hand && (
        <group position={[-0.175, -0.025, 0]}>
          {hand.map((card, i) => (
            <image
              key={i}
              src={`cards/${card}.png`}
              width={0.1}
              position={[0.05 * i, 0, 0.0025 * i]}
            />
          ))}
        </group>
      )}
    </>
  )
}

// Shows public information about the seat
export function Seat({ seat }) {
  const [player] = useSyncState(state => state.players[seat])
  const name = player.name ? player.name : null
  return (
    <>
      <text
        value={`Player: ${seat + 1}`}
        position={[0, 0.1, 0.0025]}
        color="white"
        fontSize={0.02}
        bgColor="black"
        padding={0.01}
        bgRadius={0.01}
      />
      {name !== null && (
        <text
          value={name}
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

// Fold, call or raise
// Only works if player occupies the seat
export function Actions({ seat, user }) {
  const [bet, dispatch] = useSyncState(state => state.bet)
  const [turn] = useSyncState(state => state?.turn)
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
              if (turn === null) return console.log('not active')
              if (seat != turn) return console.log('not your turn')
              if (seat != user.seat) return console.log('not your seat')
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

// Shows public information about the game state
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

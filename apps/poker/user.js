import React, { useState, useEffect } from 'react'
import { useWorld, useSyncState } from 'hyperfy'

// join button hovering above middle of table to those whose uid is not assigned to a seat
// when clicked, set user uid and assign it to the next available seat with no uid if any
// if all seats are taken, do nothing
// if the current round is not finished, allow them to join but do not deal them cards til the round is finished

export function Join({ user, setUser }) {
  const world = useWorld()
  const [seats, dispatch] = useSyncState(state => state.seats)
  const [emergency, setEmergency] = useState(false)

  useEffect(() => {
    if (!user.uid) return
    const seat = Object.keys(seats).find(seat => seats[seat].uid === user.uid)
    if (seat) {
      setUser({ ...user, seat })
    }
  }, [user.uid])

  // useEffect, monitor seats[user.seat].uid, if == null, set clear user.seat
  useEffect(() => {
    if (!user.seat) return
    if (!seats[user.seat].uid) {
      setUser({ uid: null, seat: null })
    }
  }, [seats])

  return (
    <>
      <billboard axis="y">
        <text
          value={user.uid ? 'Exit' : 'Join'}
          position={[0, 0.25, 0]}
          color="white"
          bgColor="black"
          padding={0.05}
          bgRadius={0.05}
          onClick={() => {
            const avatar = world.getAvatar()
            if (user.seat) {
              dispatch('exit', user.seat)
              setUser({ uid: null, seat: null })
            } else {
              dispatch('join', avatar?.uid)
              setUser({ uid: avatar?.uid, seat: null })
            }
          }}
        />
      </billboard>
      {user.seat && (
        <billboard axis="y">
          <text
            value={emergency ? 'Reset' : '!!!'}
            onClick={() => {
              if (emergency) {
                dispatch('reset')
                setEmergency(false)
              } else {
                setEmergency(true)
              }
            }}
          />
        </billboard>
      )}
    </>
  )
}

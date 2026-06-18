// Web Vibration API helpers. Always guarded — desktop browsers and iOS Safari
// have no navigator.vibrate, so calls there are simply no-ops.
export function hapticLight() {
  if (navigator.vibrate) navigator.vibrate(10)
}

export function hapticMedium() {
  if (navigator.vibrate) navigator.vibrate(30)
}

export function hapticHeavy() {
  if (navigator.vibrate) navigator.vibrate([30, 10, 30])
}

export function hapticSuccess() {
  if (navigator.vibrate) navigator.vibrate([10, 5, 10, 5, 40])
}

export function hapticError() {
  if (navigator.vibrate) navigator.vibrate([40, 10, 40])
}

// Original, unbranded vehicle concepts for the Sketchbook Mega Ramp garage.
// Keep the underlying Sketchbook chassis and collision model intact so crashes,
 // flips, and recoveries continue to work with the upstream physics engine.
export const GARAGE = Object.freeze([
  { id: 'classic', name: 'Classic Car', icon: '🚗', color: 0x4d94df, shape: 'sedan', speed: 1, grip: 1, suspension: 1 },
  { id: 'luxury-suv', name: 'Performance SUV', icon: '🚙', color: 0xe6b72e, shape: 'suv', speed: 1.08, grip: 0.96, suspension: 1.12 },
  { id: 'sports', name: 'Sports Coupe', icon: '🏎️', color: 0xe44b48, shape: 'coupe', speed: 1.2, grip: 1.14, suspension: 0.88 },
  { id: 'supercar', name: 'Wedge Supercar', icon: '🏎️', color: 0x7b61c9, shape: 'wedge', speed: 1.28, grip: 1.08, suspension: 0.82 },
  { id: 'muscle', name: 'Muscle Car', icon: '🚘', color: 0x2c9a8e, shape: 'muscle', speed: 1.15, grip: 0.9, suspension: 0.95 },
  { id: 'buggy', name: 'Dune Buggy', icon: '🛻', color: 0xf18a38, shape: 'buggy', speed: 1.03, grip: 1.04, suspension: 1.25 }
]);
export const DEFAULT_VEHICLE = 'classic';
export function garageVehicle(id) {
  return GARAGE.find(vehicle => vehicle.id === id) ?? GARAGE[0];
}
export function garageChoice(storage) {
  try { return garageVehicle(storage?.getItem('sprouts-sketchbook-vehicle')); }
  catch { return GARAGE[0]; }
}
export function saveGarageChoice(storage, id) {
  const vehicle = garageVehicle(id);
  try { storage?.setItem('sprouts-sketchbook-vehicle', vehicle.id); } catch { /* Offline/private storage may be disabled. */ }
  return vehicle;
}

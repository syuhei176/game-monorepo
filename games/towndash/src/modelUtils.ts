import * as THREE from 'three'

/**
 * Normalizes an imported model in place so it has a known on-screen size and
 * sits on the ground: scaled to `targetHeight`, centred on X/Z, and with its
 * bottom at y = 0. This absorbs the unknown scale/origin of each GLB.
 */
export function prepModel(obj: THREE.Object3D, targetHeight: number): THREE.Object3D {
  obj.updateWorldMatrix(true, true)
  const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3())
  if (size.y > 0) obj.scale.multiplyScalar(targetHeight / size.y)

  obj.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(obj)
  obj.position.x -= (box.min.x + box.max.x) / 2
  obj.position.z -= (box.min.z + box.max.z) / 2
  obj.position.y -= box.min.y
  return obj
}

export function enableShadows(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    o.castShadow = true
  })
}

/**
 * Normalizes a GLB and wraps it in a group whose origin is the model's
 * bottom-centre. Callers set the *group's* world position, so the alignment
 * baked by `prepModel` is preserved — unlike setting `.position` directly on the
 * prepped object, which would overwrite the offset and bury/float the model.
 */
export function makeGroundedBase(source: THREE.Object3D, targetHeight: number): THREE.Group {
  const inner = prepModel(source, targetHeight)
  enableShadows(inner)
  const base = new THREE.Group()
  base.add(inner)
  return base
}

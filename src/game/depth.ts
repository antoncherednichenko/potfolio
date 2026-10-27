import type Phaser from 'phaser';

type ObjectTransform = Pick<
  Phaser.GameObjects.Image,
  | 'y'
  | 'width'
  | 'height'
  | 'displayOriginX'
  | 'displayOriginY'
  | 'scaleX'
  | 'scaleY'
  | 'rotation'
>;

// Transform the local bottom-center anchor, not the visual center or the
// rotated bounding box. Phaser has already applied Tiled's position offsets.
export function getBaseY(object: ObjectTransform, localY = object.height) {
  const x = (object.width / 2 - object.displayOriginX) * object.scaleX;
  const y = (localY - object.displayOriginY) * object.scaleY;

  return (
    object.y + x * Math.sin(object.rotation) + y * Math.cos(object.rotation)
  );
}

export function getObjectDepth(
  object: ObjectTransform,
  footprint: readonly { y: number; height: number }[],
) {
  // Embedded ground collisions describe the trunk/base without transparent
  // texture padding. Use their front edge, just as we use the player's feet.
  return footprint.length > 0
    ? Math.max(...footprint.map((bounds) => bounds.y + bounds.height))
    : getBaseY(object);
}

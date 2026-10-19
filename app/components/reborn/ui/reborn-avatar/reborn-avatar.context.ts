import type { ComputedRef, InjectionKey } from 'vue';
import type { AvatarShape, AvatarSize } from './reborn-avatar.config';

/** 只共享尺寸和形状，单个头像显式传值时仍可覆盖。 */
export interface AvatarGroupContext {
  size: ComputedRef<AvatarSize | undefined>;
  shape: ComputedRef<AvatarShape | undefined>;
}

export const avatarGroupKey: InjectionKey<AvatarGroupContext> = Symbol('reborn-avatar-group');

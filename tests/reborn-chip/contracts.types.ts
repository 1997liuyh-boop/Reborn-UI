import type { ClassValue } from 'clsx';
import type { ChipProps, ChipUI } from '../../app/components/reborn/ui/reborn-chip';
import type { TransferUI } from '../../app/components/reborn/ui/reborn-transfer';
import type { RebornWatermarkProps, RebornWatermarkUI } from '../../app/components/reborn/ui/reborn-watermark/RebornWatermark.vue';

/** 公共类型必须接受组合类名，并拒绝不存在的档位及结构键。 */
const classes: ClassValue = ['text-sm', { 'font-medium': true }];
export const chip: ChipProps = { color: 'primary', size: 'md', position: 'top-left', class: classes, ui: { label: classes } };
export const transfer: TransferUI = { panel: classes, itemLabel: classes };
export const watermark: RebornWatermarkProps = { customClass: classes, ui: { watermark: classes } };

// @ts-expect-error 不存在的颜色不能静默退回无样式。
export const invalidColor: ChipProps = { color: 'custom-color' };
// @ts-expect-error 尺寸只接受实现支持的三档。
export const invalidSize: ChipProps = { size: 'xl' };
// @ts-expect-error 定位只接受四角。
export const invalidPosition: ChipProps = { position: 'center' };
// @ts-expect-error 根节点拼写错误必须被发现。
export const invalidChipUI: ChipUI = { rooot: classes };
// @ts-expect-error 穿梭框没有任意结构键。
export const invalidTransferUI: TransferUI = { itemLable: classes };
// @ts-expect-error 水印只有根节点与水印层。
export const invalidWatermarkUI: RebornWatermarkUI = { label: classes };

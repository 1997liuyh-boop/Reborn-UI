import type { VariantProps } from '../../app/lib/tv';
import { tv } from '../../app/lib/tv';

const theme = tv({ slots: { root: 'flex', label: 'font-bold' }, variants: { size: { sm: { root: 'h-6' }, lg: { root: 'h-10' } } } });
type Props = VariantProps<typeof theme>;
const props: Props = { size: 'sm' };
const classes: string = theme(props).root({ class: 'h-8' });
void classes;
// @ts-expect-error 未声明的变体值必须被类型系统拒绝。
theme({ size: 'invalid' });
// @ts-expect-error 未声明的 slot 必须被类型系统拒绝。
theme().missing();
const plain: string = tv({ base: 'flex' })();
void plain;

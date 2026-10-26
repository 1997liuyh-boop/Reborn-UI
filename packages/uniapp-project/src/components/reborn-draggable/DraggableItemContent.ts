import type { VNodeChild } from 'vue'
import { defineComponent } from 'vue'

interface ItemScope {
  item: any
  index: number
  dragging: boolean
  dragIndex: number
  insertIndex: number
}

interface Props extends ItemScope {
  renderItem?: (scope: ItemScope) => VNodeChild
}

// H5 独立渲染作用域插槽：业务字段在本项收集依赖，外层位移不会重跑业务内容。
export default defineComponent((props: Props) => () => props.renderItem?.({
  item: props.item,
  index: props.index,
  dragging: props.dragging,
  dragIndex: props.dragIndex,
  insertIndex: props.insertIndex,
}), {
  name: 'DraggableItemContent',
  props: ['renderItem', 'item', 'index', 'dragging', 'dragIndex', 'insertIndex'],
})

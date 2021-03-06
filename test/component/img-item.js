Component({
  properties: {
    /**
     * 图片信息
     * @type {path:String,size:Number}
     */
    img: Object,
    /**
     * 此元素是否正则移动
     */
    moving: Boolean,

    /**
     * 编号
     */
    index: Number,

    /**
     * 是否可移动[组件元素之间同步]
     */
    movable: Boolean,
    //size
  },
  methods: {
    /**
     * 轻点预览
     * this.dataset.id 可获取当前的index
     * @param {Event} e
     */
    onTap(e) {
      this.triggerEvent("preview");
    },
    /**
     * 点击删除
     * triggerEvent 父组件进行删除
     */
    onLongPress(e) {
      wx.showModal({
        title: '提示',
        content: '确认删除这张图片吗',
        success: res => res.confirm && this.triggerEvent("delete")
      })
    },
  }
});
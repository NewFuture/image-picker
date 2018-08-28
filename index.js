// wx.nextTick 兼容支持
// 2.2.3
// https://developers.weixin.qq.com/miniprogram/dev/api/custom-component.html
if (!wx.nextTick) {
    wx.nextTick = setTimeout;
}

/**
 * 临时数据缓存
 */
let Cache = {
    imgs: [],// 当前的图片列表[{path,size}]
    originIndex: -1,//记录每次移动的其实位置
    lastTargetIndex: -1,//记录移动的上一次位置
    lastPostion: {},//记录上次位置
    showTips: true, //是否显示提示通知，首次添加图片时显示通知
}
/**
 * 方格图片状态 
 */
const STATUS = {
    ACTIVE: "is-active",
    MOVE: "is-moving",
    DELETE: "is-deleting"
}

/**
 * 移动数组元素
 * @param {Array} arr
 * @param {int} old_index
 * @param {int} new_index
 */
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (--k) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
};

Component({
    properties: {
        value: {
            type: Array,
            value: [],
            desc: "用户选择的照片列表,初始值"
        },
        width: {
            type: Number,
            value: wx.getSystemInfoSync().windowWidth,
            desc: "整个组件宽度，默认屏幕宽度"
        },
        column: {
            type: Number,
            value: 3,
            desc: "列数，默认3"
        },
        max: {
            type: Number,
            value: 9,
            desc: "最大图片数量，默认9"
        },
        type: {
            type: Array,
            value: ['compressed', 'original'],
            desc: "选图类型, 默认 ['compressed', 'original']"
        },
        source: {
            type: Array,
            value: ["album", "camera"],
            desc: "选图来源, 默认 ['album', 'camera']"
        },
        open: {
            type: Boolean,
            value: false,
            desc: "是否自动打开选框, 默认false"
        }
    },

    data: {
        imgList: [],//显示的图像列表
        length: 0,//每张图片的边长
        row: 1, // 总行数
        iconX: 0, //选择图像按钮横坐标
        iconY: 0, //选择图像按钮纵坐标
        disabled: false,//是否禁用移动
        animation: true,//是否启用动画
    },

    behaviors: ['wx://form-field'], //表单特性，可作为表单一部分，提交时直接获取列表

    attached() {
        this.setData({
            length: this.properties.width / this.properties.column
        });
        const value = this.properties.value;
        if (value && value.length > 0) {
            this._addPhotos(value);
        }
        if (this.properties.open) {
            this.onChooseImage();
        }
        // 计算每张图的边长
    },

    methods: {
        /**
         * 选图事件
         */
        onChooseImage() {
            let count = this.properties.max - this.properties.imgList.length;
            wx.chooseImage({
                count: count,
                sizeType: this.properties.type,
                sourceType: this.properties.source,
                success: (res) => {
                    console.debug('choose', res.tempFiles);
                    this._addPhotos(res.tempFiles);
                    if (Cache.showTips) {
                        wx.showToast({
                            title: '拖动图片调顺，长按删除',
                            icon: 'none',
                            // duration: 1200,
                        })
                        Cache.showTips = false;
                    }
                },
                fail: (err) => {
                    console.error(err);
                }
            });
        },

        /**
         * 发生触摸事件
         * @param {*} e
         */
        onTouchStart(e) {
            const id = e.currentTarget.dataset.id;
            Cache.originIndex = Cache.lastTargetIndex = this._findValueIndexByImgListId(id);;
            this.setData({
                [`imgList[${id}].status`]: STATUS.ACTIVE,
                animation: true, //delete 关闭animation
                disabled: false,
            })
        },

        /**
        * 出发移动事件
        * Touchend 事件触发后还会触发数次change事件
        * 此次通过检查状态判断是否处理
        * @param {*} e
        */
        onChange(e) {
            const detail = e.detail;
            if (!detail.source) {
                return;
            }
            // console.log(e)

            const id = e.currentTarget.dataset.id;
            const imgList = this.data.imgList;

            if (imgList[id].status == STATUS.ACTIVE) {
                Cache.lastTargetIndex = this._findValueIndexByImgListId(id);
                this._updateAsync(`imgList[${id}].status`, STATUS.MOVE);
                return;
            } else if (imgList[id].status != STATUS.MOVE) {
                // not movable
                return;
            }

            const x = detail.x;
            const y = detail.y;
            const delta = this.data.length / 6;

            if (Math.abs(Cache.lastPostion.x - x) < delta && Math.abs(Cache.lastPostion.y - y) < delta) {
                //计算移动距离小于 delta 时不处理
                return
            }

            Cache.lastPostion = { x, y }

            console.debug('change:', id, Cache.originIndex, 'last target index', Cache.lastTargetIndex);
            const newTargetIndex = this._getTargetIndex(x, y);
            if (newTargetIndex >= 0 && newTargetIndex !== Cache.lastTargetIndex) {
                // 计算新坐标，异步刷新
                const data = this._move(Cache.lastTargetIndex, newTargetIndex);
                data[`imgList[${id}].x`] = x;
                data[`imgList[${id}].y`] = y;
                this._updateAsync(data);
                Cache.lastTargetIndex = newTargetIndex;
            }
        },

        /**
         * 触摸操作结束
         * @param {Event} e
         */
        onTouchEnd(e) {
            const lastindex = Cache.lastTargetIndex;
            if (lastindex < 0) {
                return
            }

            const imgList = this.data.imgList;
            const id = e.currentTarget.dataset.id;
            if (imgList[id].status != STATUS.ACTIVE && imgList[id].status != STATUS.MOVE) {
                return
            }

            console.info('move end to', lastindex);
            const valueIndex = this._findValueIndexByImgListId(id);

            const x = valueIndex % this.properties.column * this.data.length;
            const y = Math.floor(valueIndex / this.properties.column) * this.data.length;


            if (lastindex != Cache.originIndex) {
                this._triggerInput(Cache.imgs, 'move');
            }

            this._updateAsync({
                [`imgList[${id}].status`]: '',
                [`imgList[${id}].x`]: x,
                [`imgList[${id}].y`]: y,
            });

            // setData 两次
            // hack for moveable-view (Transform与X,Y不同步)
            this._updateAsync({
                [`imgList[${id}].x`]: x,
                [`imgList[${id}].y`]: y,
            });

            Cache.originIndex = -1;
            Cache.lastTargetIndex = -1;
        },

        /**
         * 删除
         * @param {Event} e
         */
        onDel(e) {
            const id = e.currentTarget.dataset.id;
            const imgList = this.data.imgList;
            if (imgList[id].status !== STATUS.ACTIVE) { //防误触事件叠加
                return;
            }
            this._updateAsync({
                [`imgList[${id}].status`]: STATUS.DELETE,
                disabled: true,
            });
            wx.showModal({
                title: '提示',
                content: '确认删除这张图片',
                success: res => {
                    if (res.confirm) {
                        this._delete(id);
                    }
                },
                complete: () => this._clearStatus(id),
            })
        },

        /**
         * 轻点预览
         * @param {Event} e
         */
        onTap(e) {
            let id = e.currentTarget.dataset.id;
            if (this.data.imgList[id].status && this.data.imgList[id].status !== STATUS.ACTIVE) { //防误触事件叠加
                return;
            }
            let urls = Cache.imgs.map(f => f.path);
            wx.previewImage({
                current: urls[this._findValueIndexByImgListId(id)],
                urls: urls,
                complete: () => this._clearStatus(id)
            });
        },

        /**
         * 触发input事件
         * @param {Array} value
         */
        _triggerInput(value, type) {
            console.info('new value', value);
            this.triggerEvent("input", { value, type });
        },

        /**
         * 
         * @param {number} x
         * @param {number} y
         */
        _getTargetIndex(x, y) {

            const length = this.data.length;
            if (x < 0) { x = 1 };
            if (y < 0) { y = 1 };
            let pointX = x + length / 2;
            let pointY = y + length / 2;
            if (pointX > this.properties.width) {
                pointX = this.properties.width - 1;
            }
            if (pointY > this.data.row * length) {
                pointY = this.data.row * length - 1;
            }

            const col = this.properties.column;
            let n = Cache.imgs.length;
            while (n--) {
                const X = (n % col) * length;
                const Y = Math.floor(n / col) * length;
                if (X < pointX && pointX < X + length && Y < pointY && pointY < Y + length) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * 移动交换
         * @param {int} start
         * @param {int} end
         * @returns {object}
         */
        _move(start, end) {
            let step = start < end ? 1 : -1;

            console.info(`move[${Cache.originIndex}]:`, 'from', start, 'to', end, 'step', step);

            const imgList = this.data.imgList;
            const value = Cache.imgs;
            const col = this.properties.column;
            const length = this.data.length;
            array_move(value, start, end);

            const updateData = {};
            for (let i = start; i != end; i += step) {
                let id = imgList.findIndex(e => e.img == value[i]);
                if (id < 0) {
                    console.error('img not found:', i, value[i]);
                    continue;
                }
                updateData[`imgList[${id}].x`] = (i % col) * length;
                updateData[`imgList[${id}].y`] = Math.floor(i / col) * length;
            }
            return updateData;
        },

        /**
         * 添加图片
         *
         * @param {array} fileList
         */
        _addPhotos(fileList) {
            const value = Cache.imgs;
            Array.prototype.push.apply(value, fileList);//merge
            this._triggerInput(value, 'add');
            const imgList = this.data.imgList;
            const length = this.data.length;
            const col = this.properties.column;

            const updateData = {};
            let len = imgList.length;

            fileList.forEach(img => {
                updateData[`imgList[${len}]`] = {
                    img,
                    x: (len % col) * length,
                    y: Math.floor(len / col) * length,
                }
                ++len;
            });

            if (len < this.properties.max) {
                updateData['row'] = Math.ceil((len + 1) / col);
                updateData['iconX'] = (len % col) * length;
                updateData['iconY'] = Math.floor(len / col) * length;
            } else {
                // 达到最大值
                updateData['row'] = Math.ceil(len / col);
                updateData['iconX'] = null;
                updateData['iconY'] = null;
            }
            this._updateAsync(updateData);
        },


        /**
         * 同步删除索引
         * @param {int} index
         */
        _delete(id) {
            console.log('del', id);
            const imgList = this.data.imgList;
            const value = Cache.imgs;
            let value_index = this._findValueIndexByImgListId(id);
            value.splice(value_index, 1);
            this._triggerInput(value, 'delete');
            imgList.splice(id, 1);


            const col = this.properties.column;
            const length = this.data.length;
            const to = value.length;

            while (value_index < to) {
                const item = imgList.find(e => e.img == value[value_index]);
                item.x = (value_index % col) * length;
                item.y = Math.floor(value_index / col) * length;
                ++value_index;
            }

            this.setData({
                imgList,
                row: Math.ceil((to + 1) / col),
                iconX: Math.floor(to % col) * length,
                iconY: Math.floor(to / col) * length,
                animation: false,
            });
        },

        /**
         * 根据imglist ID反查显示图像中的索引顺序
         * @param {number} id
         */
        _findValueIndexByImgListId(id) {
            return Cache.imgs.indexOf(this.data.imgList[id].img);
        },

        /**
         * clear index status
         * @param {int} id 
         */
        _clearStatus(id) {
            this._updateAsync({
                [`imgList[${id}].status`]: '',
                disabled: false,
                animation: true
            });
        },

        /**
         * 异步更新数据
         * @param {object|string} data 
         * @param {any} value 
         */
        _updateAsync(data, value) {
            if (2 == arguments.length) {
                data = { [data]: value };
            }
            wx.nextTick(() => {
                this.setData(data);
            })
        }
    }
});

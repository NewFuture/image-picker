# image-picker
Customized image picker for Wechat MiniProgram,小程序自定义图片选择组件

### Features
* [x] 任意数量
* [x] 移动调整顺序
* [x] 删除
* [x] 实时修改
* [x] Tap event

### Todo
* [ ] 编号
* [ ] 自定义图片文字

## Install
via npm
```
npm i miniprogram-image-picker -S
```

```json
{
  "usingComponents": {
    "image-picker": "miniprogram-image-picker"
  }
}
```
## Usage

### wxml
```html
<image-picker
    bind:input="输入响应回调事件"
    value="图像列表[{path,size}],默认空"
    column="列数默认1~5: 3"
    max="最多图片数量可以超过9默认: 9"
    tap-preview="点击图片预览,如果false会触发tapItem,默认: true"
    data-open="是否立即打开选择器,默认: {{false}}"
    data-source="选图来源, 默认: {{['album', 'camera']}}"
    data-type="图片压缩类型,默认: {{['compressed', 'original']}}"
/>
```

当属性`value`,`column`,`max`更新时，视图会自动更新

example
```html
<image-picker
    bind:input="onImgsUpdate"
    value="{{[{path:'xxxx',size:''}]}}"
    column="4"
    max="16"
    data-open="{{true}}"
    data-source="{{['album']}}"
    data-type="{{['compressed']}}"
/>
```
### events

* `input`
> 图片列表发生变化

```js
event.detail = { value, type };
event.detail.type // string 获取事件内容类型 包括: "add" ,"delete","move"
e.detail.value = [{path,size}] // Array 图像对象列表
```


example event detail

```json
{
  "value":[
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.9SHfItdYeoVz7205b342cc5ec2480d7fea923836a227.jpg","size":18153},
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.ZaqbvhV5XSs0beb97b7db6208cbd8c1f3001dd83ef5c.jpg","size":15233},
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.wNsZ7ruZD0sT0668a02aeb46768d750fff59bf6737b8.jpg","size":11792},
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.vGY6456CvSGvcf8149c4beb7f4deeb3680ae2f219b51.jpg","size":19320},
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.BImgk5zyXJDv630a1e89c698fee6cef3948394866249.jpg","size":19560}
  ],
  "type":"move"
}
```

* `tapItem`
> 点击图片 `tap-preview`需要设置为false
```js
{ index, size, path };
```

* `add`
> 添加事件触发
```js
[{ size, path }];
```

* `delete`
> 删除事件触发
```js
{index}
```

* `move`
> 移动事件触发
```js
{
  form, //源 index
  to, // 目标 index
} 
```



#### bind input

```html
<image-picker bind:input="onInput"/>
```
```js
Page({
    data: {
        pictures: []
    },
    onInput(e) {
        this.setData({ pictures: e.detail.value })
    }
});
```

#### wxss样式覆盖

可以覆盖组件默认[样式文件](index.wxss)的class

```css
.ImagePicker {/*整个组件样式*/}
.ImagePicker-item {/*每个方框样式*/}
.ImagePicker-itemImg {/*每个方框内图片样式*/}
.ImagePicker-addIcon {/*添加按钮样式*/}
```

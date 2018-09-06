<template>
  <div class="gojs-container flowchart-container" style="width: 100%; display: flex; justify-content: space-between">
    <div id="myPaletteDiv" style="width: 300px; margin-right: 10px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); background: rgba(0,0,0,.03);"></div>
    <div id="myDiagramDiv" style="flex-grow: 1; height: 750px; border: solid 1px rgba(43, 52, 65, 0.4); background: rgba(0,0,0,.05);"></div>
    <button style="position: absolute; top: -30px; left: 0px; z-index: 30;" @click="saveFlowChart">获取</button>
  </div>
</template>

<script>
import go from 'gojs'
export default {
  name: 'flowchart',
  data () {
    return {
      myDiagram: {}, // gojs创建的流程实例
      flowData: {
        class: 'go.GraphLinksModel',
        linkFromPortIdProperty: 'fromPort',
        linkToPortIdProperty: 'toPort',
        nodeDataArray: [
          {
            category: 'Start',
            text: '申请人',
            key: -1,
            loc: '-102 47.35979343601207'
          },
          { category: 'End', text: '结束', key: -5, loc: '-102 356' }
        ],
        linkDataArray: [
          {
            from: -1,
            to: -5,
            fromPort: 'B',
            toPort: 'T',
            points: [
              -102,
              112.35979343601207,
              -102,
              122.35979343601207,
              -102,
              219.17989671800603,
              -102,
              219.17989671800603,
              -102,
              316,
              -102,
              326
            ]
          }
        ]
      }, // 流程图数据
      alowDelEnd: false // 是否允许删除当前选中的结束节点
    }
  },
  watch: {},
  created () {
    // 初始化数据,如果不是编辑就执行这段代码
    for (const val of this.flowData.nodeDataArray) {
      val.key = this.newGuid()
    }
    this.flowData.linkDataArray[0].from = this.flowData.nodeDataArray[0].key
    this.flowData.linkDataArray[0].to = this.flowData.nodeDataArray[1].key
    // console.log(this.flowData)
  },
  mounted () {
    this.initGojs()
  },
  activated () {
    // keep-alive 组件激活时调用。
    // 该钩子在服务器端渲染期间不被调用。
    // 当页面存在缓存的时候执行该函数。
    this.initGojs()
  },
  deactivated () {
    // keep-alive 组件停用时调用。
    // 该钩子在服务器端渲染期间不被调用。
    // 在页面结束时触发该方法，可清除掉滚动方法等缓存。
    // this.destroyTinymce()
  },
  methods: {
    initGojs () {
      const _this = this
      const $ = go.GraphObject.make // for conciseness in defining templates

      this.myDiagram = $(
        go.Diagram,
        'myDiagramDiv', // must name or refer to the DIV HTML element
        {
          allowClipboard: false, // 不允许从内部剪贴板复制或粘贴部件
          allowCopy: false, // 不允许复制
          initialContentAlignment: go.Spot.Center,
          allowDrop: true, // must be true to accept drops from the Palette
          LinkDrawn: showLinkLabel, // this DiagramEvent listener is defined below
          LinkRelinked: showLinkLabel,
          scrollsPageOnFocus: false,
          'undoManager.isEnabled': true // enable undo & redo
        }
      )

      // 当文档被修改时，添加一个 '*' 并启用 'Save' 按钮
      this.myDiagram.addDiagramListener('Modified', function (e) {
        var button = document.getElementById('SaveButton')
        if (button) button.disabled = !_this.myDiagram.isModified
        var idx = document.title.indexOf('*')
        if (_this.myDiagram.isModified) {
          if (idx < 0) document.title += '*'
        } else {
          if (idx >= 0) document.title = document.title.substr(0, idx)
        }
      })

      // helper definitions for node templates

      function nodeStyle () {
        return [
          // The Node.location comes from the "loc" property of the node data,
          // converted by the Point.parse static method.
          // If the Node.location is changed, it updates the "loc" property of the node data,
          // converting back using the Point.stringify static method.
          new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(
            go.Point.stringify
          ),
          {
            // 这个 Node.location 在每个节点的中心
            locationSpot: go.Spot.Center
          }
        ]
      }

      // 定义一个用于创建通常透明的“端口”的函数。
      // 这个 'name' 被用作 GraphObject.portId
      // 这个 'align' 用于确定将端口相对于节点的主体位置的位置，
      // 这个 'spot' 用于控制连接与端口的连接以及端口
      // 沿着节点的一侧延伸，
      // 而布尔值 'output' 和 'input' 参数则控制用户是否可以从端口或端口上绘制链接。
      function makePort (name, align, spot, output, input) {
        var horizontal =
          align.equals(go.Spot.Top) || align.equals(go.Spot.Bottom)
        // 这个端口基本上就是一个透明的矩形，它沿着节点的一侧延伸，
        // 当鼠标经过时，它就变成了颜色
        return $(go.Shape, {
          fill: 'transparent', // 在mouseEnter事件处理程序中更改为颜色
          strokeWidth: 0, // no stroke
          width: horizontal ? NaN : 8, // 将端口对齐到主形状上
          height: !horizontal ? NaN : 8, // 将端口对齐到主形状上
          alignment: align, // 将端口对齐到主形状上
          stretch: horizontal
            ? go.GraphObject.Horizontal
            : go.GraphObject.Vertical,
          portId: name, // 将这个对象声明为一个“端口”
          fromSpot: spot, // 声明链接可以在这个端口上连接
          fromLinkable: output, // 声明用户是否可以从这里获取链接
          toSpot: spot, // 声明链接可以在这个端口上连接
          toLinkable: input, // 声明用户是否可以在这里画链接
          cursor: 'pointer', // 显示一个不同的光标来指示潜在的链接点
          mouseEnter: function (e, port) {
            // 端口参数是这个形状
            if (!e.diagram.isReadOnly) port.fill = 'rgba(255,0,255,0.5)'
          },
          mouseLeave: function (e, port) {
            port.fill = 'transparent'
          }
        })
      }

      function textStyle () {
        return {
          font: 'bold 11pt Helvetica, Arial, sans-serif',
          stroke: 'whitesmoke'
        }
      }

      // 为常规节点定义节点模板
      this.myDiagram.nodeTemplateMap.add(
        'Step', // the default category
        $(
          go.Node,
          'Table',
          nodeStyle(),
          // 主对象是一个面板，围绕着一个矩形的文本块
          $(
            go.Panel,
            'Auto',
            $(
              go.Shape,
              'Rectangle',
              {
                fill: 'rgba(11, 178, 122, 0.5)',
                strokeWidth: 0,
                stroke: null,
                width: 270,
                height: 130
              },
              new go.Binding('figure', 'figure')
            ),
            $(go.Picture, {
              alignment: new go.Spot(0, 0),
              width: 270,
              height: 130,
              source: '/static/flow_chart_bg2.png'
            }),
            $(
              go.TextBlock,
              textStyle(),
              {
                alignment: new go.Spot(0.2, 0.16),
                font: '12pt sans-serif',
                overflow: go.TextBlock.OverflowEllipsis,
                maxSize: new go.Size(160, NaN),
                wrap: go.TextBlock.None,
                width: 218
              },
              new go.Binding('text').makeTwoWay()
            ),
            $(
              go.TextBlock,
              textStyle(),
              {
                text: '负责人：3人',
                stroke: '#b0b0b9',
                alignment: new go.Spot(0.4, 0.6),
                font: '10pt sans-serif',
                overflow: go.TextBlock.OverflowEllipsis,
                maxSize: new go.Size(160, NaN),
                wrap: go.TextBlock.None,
                width: 240
              }
              // new go.Binding('text').makeTwoWay()
            ),
            $(go.TextBlock, textStyle(), {
              text: '编辑当前节点',
              stroke: '#828fa5',
              alignment: new go.Spot(0.4, 0.9),
              font: '10pt sans-serif',
              overflow: go.TextBlock.OverflowEllipsis,
              maxSize: new go.Size(160, NaN),
              wrap: go.TextBlock.None,
              width: 240,
              click: function (e, node) {
                // console.log('单击了编辑操作')
                // 只有冒泡向上才能在父节点单击事件中获取当前节点的数据，
                // 延时才能在这里获取到父级节点的数据
                _this.editNOde(node.part.data)
              }
            })
          ),
          // 主对象是一个面板，围绕着这个面板的四个方向的线连接点:
          makePort('T', go.Spot.Top, go.Spot.TopSide, false, true), // 上
          makePort('L', go.Spot.Left, go.Spot.LeftSide, true, true), // 左
          makePort('R', go.Spot.Right, go.Spot.RightSide, true, true), // 右
          makePort('B', go.Spot.Bottom, go.Spot.BottomSide, true, false) // 下
        )
      )

      // 审批节点
      this.myDiagram.nodeTemplateMap.add(
        'Approval', // the default category
        $(
          go.Node,
          'Table',
          nodeStyle(),
          // 主对象是一个面板，围绕着一个矩形的文本块
          $(
            go.Panel,
            'Auto',
            $(
              go.Shape,
              'Rectangle',
              {
                fill: 'rgba(11, 178, 122, 0.5)',
                strokeWidth: 0,
                stroke: null,
                width: 270,
                height: 130
              },
              new go.Binding('figure', 'figure')
            ),
            $(go.Picture, {
              alignment: new go.Spot(0, 0),
              width: 270,
              height: 130,
              source: '/static/flow_chart_bg1.png'
            }),
            $(
              go.TextBlock,
              textStyle(),
              {
                alignment: new go.Spot(0.2, 0.16),
                font: '12pt sans-serif',
                overflow: go.TextBlock.OverflowEllipsis,
                maxSize: new go.Size(160, NaN),
                wrap: go.TextBlock.None,
                width: 218
              },
              new go.Binding('text').makeTwoWay()
            ),
            $(
              go.TextBlock,
              textStyle(),
              {
                text: '负责人：3人',
                stroke: '#b0b0b9',
                alignment: new go.Spot(0.4, 0.6),
                font: '10pt sans-serif',
                overflow: go.TextBlock.OverflowEllipsis,
                maxSize: new go.Size(160, NaN),
                wrap: go.TextBlock.None,
                width: 240
              }
              // new go.Binding('text').makeTwoWay()
            ),
            $(go.TextBlock, textStyle(), {
              text: '编辑当前节点',
              stroke: 'rgba(11, 178, 122, 0.8)',
              alignment: new go.Spot(0.4, 0.9),
              font: '10pt sans-serif',
              overflow: go.TextBlock.OverflowEllipsis,
              maxSize: new go.Size(160, NaN),
              wrap: go.TextBlock.None,
              width: 240,
              click: function (e, node) {
                // console.log('单击了编辑操作')
                // 只有冒泡向上才能在父节点单击事件中获取当前节点的数据，
                // 延时才能在这里获取到父级节点的数据
                _this.editNOde(node.part.data)
              }
            })
          ),
          // 主对象是一个面板，围绕着一个矩形的文本块:
          makePort('T', go.Spot.Top, go.Spot.TopSide, false, true),
          makePort('L', go.Spot.Left, go.Spot.LeftSide, true, true),
          makePort('R', go.Spot.Right, go.Spot.RightSide, true, true),
          makePort('B', go.Spot.Bottom, go.Spot.BottomSide, true, false)
        )
      )
      // 条件判断节点
      this.myDiagram.nodeTemplateMap.add(
        'Conditional', // the default category
        $(
          go.Node,
          'Table',
          nodeStyle(),
          // 主对象是一个面板，围绕着一个矩形的文本块
          $(
            go.Panel,
            'Auto',
            $(
              go.Shape,
              'Rectangle',
              {
                fill: 'rgba(11, 178, 122, 0.5)',
                strokeWidth: 0,
                stroke: null,
                width: 270,
                height: 130
              },
              new go.Binding('figure', 'figure')
            ),
            $(go.Picture, {
              alignment: new go.Spot(0, 0),
              width: 270,
              height: 130,
              source: '/static/flow_chart_bg3.png'
            }),
            $(go.Shape, 'RoundedRectangle', {
              alignment: new go.Spot(0.4, 0.16),
              width: 250,
              height: 42,
              margin: 4,
              stroke: null,
              fill: '#fafafb'
            }),
            $(
              go.TextBlock,
              textStyle(),
              {
                alignment: new go.Spot(0.6, 0.28),
                font: '12pt sans-serif',
                stroke: '#2b3441',
                overflow: go.TextBlock.OverflowEllipsis,
                maxSize: new go.Size(160, NaN),
                wrap: go.TextBlock.None,
                width: 230
              },
              new go.Binding('text').makeTwoWay()
            ),
            $(go.TextBlock, textStyle(), {
              text: '筛选数据',
              stroke: 'rgba(11, 178, 122, 0.8)',
              alignment: new go.Spot(0.4, 0.9),
              font: '10pt sans-serif',
              overflow: go.TextBlock.OverflowEllipsis,
              maxSize: new go.Size(160, NaN),
              wrap: go.TextBlock.None,
              width: 240,
              click: function (e, node) {
                // console.log('筛选数据')
                // 只有冒泡向上才能在父节点单击事件中获取当前节点的数据，
                // 延时才能在这里获取到父级节点的数据
                _this.editNOde(node.part.data)
              }
            })
          ),
          // 主对象是一个面板，围绕着一个矩形的文本块:
          makePort('T', go.Spot.Top, go.Spot.TopSide, false, true),
          makePort('L', go.Spot.Left, go.Spot.LeftSide, true, true),
          makePort('R', go.Spot.Right, go.Spot.RightSide, true, true),
          makePort('B', go.Spot.Bottom, go.Spot.BottomSide, true, false)
        )
      )
      // 开始节点
      this.myDiagram.nodeTemplateMap.add(
        'Start', // the default category
        $(
          go.Node,
          'Table',
          nodeStyle(),
          // 主对象是一个面板，围绕着一个矩形的文本块
          $(
            go.Panel,
            'Auto',
            $(
              go.Shape,
              'Rectangle',
              {
                fill: 'rgba(11, 178, 122, 0.5)',
                strokeWidth: 0,
                stroke: null,
                width: 270,
                height: 130
              },
              new go.Binding('figure', 'figure')
            ),
            $(go.Picture, {
              alignment: new go.Spot(0, 0),
              width: 270,
              height: 130,
              source: '/static/flow_chart_bg0.png'
            }),
            $(
              go.TextBlock,
              textStyle(),
              {
                alignment: new go.Spot(0.2, 0.16),
                font: '12pt sans-serif',
                overflow: go.TextBlock.OverflowEllipsis,
                maxSize: new go.Size(160, NaN),
                wrap: go.TextBlock.None,
                width: 218
              },
              new go.Binding('text').makeTwoWay()
            ),
            $(
              go.TextBlock,
              textStyle(),
              {
                text: '工作区可填',
                stroke: '#b0b0b9',
                alignment: new go.Spot(0.4, 0.6),
                font: '10pt sans-serif',
                overflow: go.TextBlock.OverflowEllipsis,
                maxSize: new go.Size(160, NaN),
                wrap: go.TextBlock.None,
                width: 240
              }
              // new go.Binding('text').makeTwoWay()
            ),
            $(go.TextBlock, textStyle(), {
              text: '编辑当前节点',
              stroke: '#828fa5',
              alignment: new go.Spot(0.4, 0.9),
              font: '10pt sans-serif',
              overflow: go.TextBlock.OverflowEllipsis,
              maxSize: new go.Size(160, NaN),
              wrap: go.TextBlock.None,
              width: 240,
              click: function (e, node) {
                // console.log(node.part.data)
                _this.editNOde(node.part.data)
              }
            })
          ),
          // 主对象是一个面板，围绕着一个矩形的文本块:
          makePort('T', go.Spot.Top, go.Spot.TopSide, false, true),
          makePort('L', go.Spot.Left, go.Spot.LeftSide, true, true),
          makePort('R', go.Spot.Right, go.Spot.RightSide, true, true),
          makePort('B', go.Spot.Bottom, go.Spot.BottomSide, true, false)
        )
      )

      // 结束节点
      this.myDiagram.nodeTemplateMap.add(
        'End',
        $(
          go.Node,
          'Table',
          nodeStyle(),
          $(
            go.Panel,
            'Auto',
            $(go.Shape, 'Circle', {
              minSize: new go.Size(60, 60),
              fill: $(go.Brush, 'Linear', { 0.0: '#dfdfe8', 1.0: '#afafb8 ' }),
              strokeWidth: 0
            }),
            $(go.TextBlock, 'End', textStyle(), new go.Binding('text'))
          ),
          // 三个指定的端口，每个端口都有一个，除了底部，所有输入都是:
          makePort('T', go.Spot.Top, go.Spot.Top, false, true),
          makePort('L', go.Spot.Left, go.Spot.Left, false, true),
          makePort('R', go.Spot.Right, go.Spot.Right, false, true)
        )
      )
      // 描述节点
      this.myDiagram.nodeTemplateMap.add(
        'Comment',
        $(
          go.Node,
          'Auto',
          nodeStyle(),
          $(go.Shape, 'File', { fill: '#EFFAB4', strokeWidth: 0 }),
          $(
            go.TextBlock,
            textStyle(),
            {
              margin: 5,
              maxSize: new go.Size(200, NaN),
              wrap: go.TextBlock.WrapFit,
              textAlign: 'center',
              editable: true,
              font: 'bold 12pt Helvetica, Arial, sans-serif',
              stroke: '#454545'
            },
            new go.Binding('text').makeTwoWay()
          )
          // 没有端口，因为没有链接可以连接到评论
        )
      )

      // 替换linkTemplateMap中的默认链接模板
      this.myDiagram.linkTemplate = $(
        go.Link, // 整个链接面板
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 5,
          toShortLength: 4,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true,
          resegmentable: true,
          // 鼠标悬停巧妙地突出显示链接:
          mouseEnter: function (e, link) {
            link.findObject('HIGHLIGHT').stroke = 'rgba(30,144,255,0.2)'
          },
          mouseLeave: function (e, link) {
            link.findObject('HIGHLIGHT').stroke = 'transparent'
          }
        },
        new go.Binding('points').makeTwoWay(),
        $(
          go.Shape, // 最亮的形状，通常是透明的
          {
            isPanelMain: true,
            strokeWidth: 8,
            stroke: 'transparent',
            name: 'HIGHLIGHT'
          }
        ),
        $(
          go.Shape, // 链接路径形状
          { isPanelMain: true, stroke: 'gray', strokeWidth: 2 }
        ),
        $(
          go.Shape, // 箭头
          { toArrow: 'standard', strokeWidth: 0, fill: 'gray' }
        ),
        $(
          go.Panel,
          'Auto', // 链接标签，通常是不可见的
          {
            visible: false,
            name: 'LABEL',
            segmentIndex: 2,
            segmentFraction: 0.5
          },
          new go.Binding('visible', 'visible').makeTwoWay(),
          $(
            go.Shape,
            'RoundedRectangle', // the label shape
            { fill: '#F8F8F8', strokeWidth: 0 }
          ),
          $(
            go.TextBlock,
            'Yes', // the label
            {
              textAlign: 'center',
              font: '10pt helvetica, arial, sans-serif',
              stroke: '#333333',
              editable: true
            },
            new go.Binding('text').makeTwoWay()
          )
        )
      )

      // 如果从一个“条件”节点出来，使链接标签可见。
      // 这个监听器是由“LinkDrawn”和“LinkRelinked”的图表所调用的
      function showLinkLabel (e) {
        var label = e.subject.findObject('LABEL')
        if (label !== null) {
          label.visible = e.subject.fromNode.data.figure === 'Diamond'
        }
      }

      // LinkingTool和RelinkingTool使用的临时链接也是正交的：
      this.myDiagram.toolManager.linkingTool.temporaryLink.routing =
        go.Link.Orthogonal
      this.myDiagram.toolManager.relinkingTool.temporaryLink.routing =
        go.Link.Orthogonal

      this.loadFlowChart()
      // 左侧操作菜单
      const myPalette = $(
        go.Palette,
        'myPaletteDiv', // 必须命名或引用DIV HTML元素
        {
          scrollsPageOnFocus: false,
          nodeTemplateMap: this.myDiagram.nodeTemplateMap // 共用myDiagram使用的模板
        }
      )
      myPalette.model = new go.GraphLinksModel([
        // 指定节点面板的内容
        { category: 'Start', text: '申请人' },
        { category: 'Step', text: '普通节点' },
        { category: 'Approval', text: '审批节点' },
        { category: 'Conditional', text: '条件判断' },
        { category: 'End', text: '结束' },
        { category: 'Comment', text: '描述' }
      ])
      // console.log(myPalette)
      // 监听数据变化
      // 从左边功能菜单复制进工作区域
      this.myDiagram.addDiagramListener('ExternalObjectsDropped', function (
        evt
      ) {
        console.log('通过从图外部拖放将部件复制到图中')
        // console.log(evt)
        window.setTimeout(function () {
          _this.distributionId()
        }, 100)
      })
      // 单击节点/线的监听事件
      this.myDiagram.addDiagramListener('ObjectSingleClicked', function (e) {
        var part = e.subject.part
        if (!(part instanceof go.Link) && part.data.category === 'End') {
          console.log('单击了删除节点')
          console.log(part.data)
          const lintoArr = _this.flowData.linkDataArray.map(v => {
            return v.to
          })
          // console.log(lintoArr)
          const allow = lintoArr.find(m => m === part.data.key)
          if (!allow) {
            _this.alowDelEnd = true
          } else {
            _this.alowDelEnd = false
          }
        } else {
          // 不是结束节点，允许删除
          _this.alowDelEnd = true
        }
      })
      // 判断结束是否有线连接，如果有就阻止删除
      this.myDiagram.commandHandler.canDeleteSelection = function () {
        if (_this.alowDelEnd) {
          console.log('没有线连接，删除')
          return true
        } else {
          console.log('有线连接，不删除')
          return false
        }
      }
    },
    saveFlowChart () {
      // 获取流程图数据
      this.flowData = this.myDiagram.model.toJson()
      this.myDiagram.isModified = false
      console.log(this.flowData)
    },
    loadFlowChart () {
      this.myDiagram.model = go.Model.fromJson(this.flowData)
      this.myDiagram.animationManager.stopAnimation()
    },
    distributionId () {
      // 为当前流程图的新增/复制的节点分配id
      // 获取当前数据
      this.saveFlowChart()
      // console.log(newData)
      // 分配id
      this.flowData = JSON.parse(this.flowData)
      for (const item of this.flowData.nodeDataArray) {
        // console.log(item)
        if (item.key < 0) {
          item.key = this.newGuid()
        }
      }
      // this.flowData = JSON.stringify(this.flowData)
      // 更新流程图
      this.loadFlowChart()
      console.log(this.flowData)
    },
    editNOde (data) {
      // 编辑节点
      console.log(data)
      // if() {
      // }
    },
    newGuid () {
      // 动态生成GUID
      var guid = ''
      for (var i = 1; i <= 32; i++) {
        var n = Math.floor(Math.random() * 16.0).toString(16)
        guid += n
        if (i === 8 || i === 12 || i === 16 || i === 20) guid += '-'
      }
      return guid
    }
  },
  destroyed () {}
}
</script>

<style>
#myDiagramDiv canvas,
#myPaletteDiv canvas {
  outline: none;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0); /* mobile webkit */
}
</style>

﻿var myChart = echarts.init(document.getElementById('main'));
var nowyear = new Date().getFullYear();
var nowmonth = new Date().getMonth() + 1;
var url = "http://192.168.1.105:7878";
$(document).ready(function () {
  $("#main").css("display", "none");  //图表先隐藏，请求成功再show
  DateIn(); //日期控件初始化
  toar();   //提示框控件初始化
  ChangeYear();//年份赋值
  GetTotalDl();//初始查电量和金额
  InitChart();//初始查图标
  CheckInfo();  //点击条件查询图表
  GetRank(nowyear, 1); //初始化排行榜
  CheckRank();  //点击条件查询排行榜
});

//日期控件的初始化
function DateIn () {
  $('#datachange').datetimepicker({
    format: 'YYYY',
    locale: moment.locale('zh-cn'),
    defaultDate: new Date(),
  })
}

//弹出框插件初始化
function toar () {
  toastr.options = {
    closeButton: false,                                            // 是否显示关闭按钮，（提示框右上角关闭按钮）
    debug: false,                                                    // 是否使用deBug模式
    progressBar: true,                                            // 是否显示进度条，（设置关闭的超时时间进度条）
    positionClass: "toast-top-center",              // 设置提示款显示的位置
    onclick: null,                                                     // 点击消息框自定义事件 
    showDuration: "300",                                      // 显示动画的时间
    hideDuration: "1000",                                     //  消失的动画时间
    timeOut: "2500",                                             //  自动关闭超时时间 
    extendedTimeOut: "1000",                             //  加长展示时间
    showEasing: "swing",                                     //  显示时的动画缓冲方式
    hideEasing: "linear",                                       //   消失时的动画缓冲方式
    showMethod: "fadeIn",                                   //   显示时的动画方式
    hideMethod: "fadeOut"                                   //   消失时的动画方式
  };
}

//年份赋值
function ChangeYear () {
  var year = new Date().getFullYear();
  var yearhtml = "";
  for (var i = 1; i < 4; i++) {
    yearhtml += '<option value="' + year + '">' + year + '年</option>';
    year--;
  }
  $(".fullYear").append(yearhtml);
}

//根据类型、年份获取总电量和总金额
function GetTotalDl () {
  var type = $("#searctype")[0].value;
  var year = $(".fullYear")[0].value;
  $.ajax({
    type: "POST",
    url: url + '/StationRelevanceManage/GetAllStationTotalDataByTypeYearResult',
    dataType: "json",
    headers: {
      token: "123"
    },
    data: {
      type: type,
      year: year
    },
    success: function (response) {
      if (response.isSuccess) {
        var res = response.body;//接口返回的内容，body里面是请求的内容          
        var power = Number(res.totalDL.toFixed(2));
        var cost = Number(res.allFee.toFixed(2));
        $(".allPower").val(convertToBigString(power));//总电量
        $(".allCost").val(convertMoney(cost, ' 元', true));//总金额                  
      }
      else {
        toastr.error("抱歉，与服务器连接失败！");
      }
    },
    error: function () {
      toastr.error("抱歉，与服务器连接失败！");
    }
  })
}

//初始化图表
function InitChart () {
  var Year = $(".fullYear")[0].value;
  var Type = $("#searctype")[0].value;
  $.ajax({
    type: "POST",
    url: url + '/StationRelevanceManage/GetStationMonthTotalDLByTypeYearList',
    dataType: "json",
    headers: {
      token: "123"
    },
    data: {
      type: Type,
      year: Year
    },
    success: function (response) {
      if (response.isSuccess) {
        var data = response.body;
        if (data.length == 0) {
          $("#main").css("display", "none");
        }
        else {
          $("#main").css("display", "block");
          var list = data.totalDlList;
          var everydate = [];
          var PowerY = [];
          // var sbtitle = $("#stationListSelect").next('button')[0].title
          for (var m = 0; m < list.length; m++) {
            everydate.push(list[m].monthNum);
            PowerY.push(list[m].totalDL);
          }
          var option = {
            title: {
              text: '所有电站' + Year + '年每月充电量',
              subtext: "点击每月柱状图可查看该月每日情况",
              padding: [30, 20, 10, 25],
              margin: 10,
              subtextStyle: {
                color: '#666',
                fontWeight: "bold",
                fontSize: "15"
              }
            },
            toolbox: {
              feature: {
                magicType: { show: true, type: ['line', 'bar'] },
                // restore: { show: true },
                saveAsImage: { show: true }
              }
            },
            grid: {
              top: '25%',
              left: '12%'
            },
            tooltip: {
              show: true,
              confine: true, //将提示框放在图表内
              formatter: '日期:{b} 月<br/>充电电量:{c} kWh',
            },
            legend: {
              data: ['电量']
            },
            xAxis: {
              name: '月份',
              data: everydate,
              nameTextStyle: {
                padding: [0, 0, 0, -5]
              },
              triggerEvent: true
            },
            yAxis: {

              type: 'value',
              name: 'kWh',
              axisLabel: {
                //            	inside:true
                rotate: 45
              },
              splitLine: {
                lineStyle: {
                  color: 'rgb(34,57,91)'
                }
              }
            },
            series:
              [
                {
                  label: {
                    show: true,
                    position: 'top',
                    color: '#666'
                  },
                  itemStyle: {
                    color: '#5bc0de',
                    opacity: 8
                  },
                  barMaxWidth: 40,
                  name: '电量',
                  type: 'bar',
                  data: PowerY,
                  itemStyle: {
                    color: new echarts.graphic.LinearGradient(
                      0, 1, 0, 0,
                      [
                        { offset: 1, color: '#b9ecfb' },
                        { offset: 0.7, color: '#5bc0de' },
                        { offset: 0, color: '#0085ac' },

                      ]
                    )
                  },
                }
              ]
          };


          myChart.setOption(option, true);
          myChart.on('click', function (params) {
            console.log(params.name);
            var type = $("#searctype")[0].value;
            var year = $(".fullYear").val();
            if (params.componentType == "xAxis") {
              var month = params.value;
              location.href = "./alldetails.html?type=" + type + "&year=" + year + "&month=" + month;
            } else {
              var month = params.name;
              location.href = "./alldetails.html?type=" + type + "&year=" + year + "&month=" + month;
            }
          });
          window.addEventListener("resize", function () {
            myChart.resize();   //myChart指自己定义的echartsDom对象
          });
          return option;
        }
      }
      else {
        $("#main").css("display", "none");
        toastr.error("抱歉，与服务器连接失败！");
      }
    },
    error: function () {
      toastr.error("抱歉，与服务器连接失败！");
    }
  })
}

//点击按钮请求图表数据
function CheckInfo () {
  $("#checkinfo").on('click', function () {
    InitChart();
    GetTotalDl();
  })
}

//初始查询当年排名
function GetRank (year, type) {
  var rankPanel = $("#rankList");
  var trtmp = "";
  $.ajax({
    type: "POST",
    url: url + "/StationRelevanceManage/GetAllStationTotalDByYearList",
    data: {
      pageIndex: 1,
      pageCount: 10,
      year: year,
      type: type
    },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        var list = response.body.list;
        if (list.length > 0) {
          for (var i = 0; i < list.length; i++) {
            trtmp += ("<tr><td class='stationId'>" + Number(i + 1) + "</td><td class='station'>" + list[i].stationName + "</td>" +
              "<td class='power'>" + convertToBigString(list[i].totalDL) + "</td></tr>");
          }
          rankPanel.html(trtmp);
        }
        else {
          trtmp = ("<tr><td class='stationId'></td><td class='station'>暂无该年数据~</td><td class='power'></td></tr>")
          rankPanel.html(trtmp);
          toastr.warning("该年充电排行没有数据~");
        }
      }
      else {
        toastr.error("抱歉，与服务器连接失败！");
      }
    },
    error: function (jqXHR) {
      trtmp = ("<tr><td class='stationId'></td><td class='station'>暂无该年数据~</td><td class='power'></td></tr>")
      rankPanel.html(trtmp);
      toastr.error("抱歉，与服务器连接失败！");
    }
  });

}

//点击查询当年排名
function CheckRank () {
  $("#checkrank").on('click', function () {
    var thisdate = $("#datachange")[0].value,
      type = $(".searctype2")[0].value;
    GetRank(thisdate, type);
  })
}

//电量单位转换
function convertToBigString (val) {
  if (val > 1000 * 1000 * 10) {
    return (val / (1000 * 1000)).toFixed(2) + ' GWh';
  }
  if (val > 1000 * 10) {
    return (val / 1000).toFixed(2) + ' MWh';
  }
  return (val).toFixed(2) + ' KWh';
}

//金钱单位转换
function convertMoney (val, preix, isRemain) {
  if (val > 10000 * 1000) {

    if (isRemain) {
      return (val / (10000 * 1000)).toFixed(2) + ' 千万元';
    }
    return (val / (10000 * 1000)).toFixed(0) + ' 千万元';
  }
  if (val > 10000 * 10) {
    if (isRemain) {
      return (val / 10000).toFixed(2) + ' 万元';
    }
    return (val / 10000).toFixed(0) + ' 万元';
  }
  if (isRemain) {
    return (val).toFixed(2) + preix;
  }
  return (val).toFixed(0) + preix;
}